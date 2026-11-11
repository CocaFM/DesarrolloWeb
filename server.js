const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend (permite probar todo con solo ejecutar node server.js)
app.use(express.static(__dirname));

// Cadena de conexión hacia tu clúster de MongoDB Atlas
const uri = process.env.MONGO_URI || "mongodb+srv://vicentevalenzuela3_db_user:d88Psnpq3NXarIz4@cluster0.0usjlfc.mongodb.net/cybercate?retryWrites=true&w=majority";
const cliente = new MongoClient(uri);

let db;
let clientesCollection;
let encargadosCollection;
let adminCollection;

// =============================================================================
// 1. RÚBRICA EVALUADA: USUARIOS, LOGIN Y REGISTRO
// =============================================================================

// GET /api/usuarios - Obtener todos los usuarios unificados (Rúbrica de la entrega)
app.get('/api/usuarios', async (req, res) => {
  try {
    const [clientes, encargados, admins] = await Promise.all([
      clientesCollection.find({}).toArray(),
      encargadosCollection.find({}).toArray(),
      adminCollection.find({}).toArray()
    ]);

    const listaUnificada = [
      ...admins.map(u => ({ id: u.id || u._id, nombre: u.nombre || u.usuario, usuario: u.correo || u.usuario, rol: 'admin', activo: true })),
      ...encargados.map(u => ({ id: u.id || u._id, nombre: u.nombre || u.usuario, usuario: u.correo || u.usuario, rol: 'encargado', activo: true })),
      ...clientes.map(u => ({ id: u.id || u._id, nombre: u.nombre || u.usuario, usuario: u.correo || u.usuario, rol: 'cliente', activo: true }))
    ];

    res.json(listaUnificada);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al consultar usuarios en Atlas: ' + error.message });
  }
});

// POST /api/login - Login de usuarios contra MongoDB Atlas
app.post('/api/login', async (req, res) => {
  try {
    const usuarioRecibido = (req.body.usuario || req.body.correo || '').trim().toLowerCase();
    const claveRecibida = (req.body.clave || req.body.password || req.body.pass || '').trim();

    if (!usuarioRecibido || !claveRecibida) {
      return res.status(400).json({ mensaje: 'Completa usuario y clave' });
    }

    // Buscar en las 3 colecciones de forma insensible a mayúsculas
    const query = {
      $or: [
        { usuario: new RegExp(`^${usuarioRecibido}$`, 'i') },
        { correo: new RegExp(`^${usuarioRecibido}$`, 'i') }
      ]
    };

    const [adminEncontrado, encargadoEncontrado, clienteEncontrado] = await Promise.all([
      adminCollection.findOne(query),
      encargadosCollection.findOne(query),
      clientesCollection.findOne(query)
    ]);

    const encontrado = adminEncontrado || encargadoEncontrado || clienteEncontrado;
    const rol = adminEncontrado ? 'admin' : (encargadoEncontrado ? 'encargado' : 'cliente');

    // Valida contra 'pass', 'clave' o 'password' para compatibilidad total con todas las colecciones
    if (encontrado) {
      const passwordGuardada = encontrado.pass || encontrado.clave || encontrado.password;
      if (passwordGuardada === claveRecibida) {
        return res.json({
          mensaje: 'Acceso aceptado.',
          nombre: encontrado.nombre || encontrado.usuario || usuarioRecibido,
          rol: rol
        });
      }
    }

    res.status(401).json({ mensaje: 'Usuario o clave incorrectos' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error durante el inicio de sesión: ' + error.message });
  }
});

// POST /api/registro - Registro de nuevos usuarios
app.post('/api/registro', async (req, res) => {
  try {
    const usuarioRecibido = (req.body.usuario || req.body.correo || '').trim().toLowerCase();
    const claveRecibida = (req.body.clave || req.body.password || req.body.pass || '').trim();
    const nombreRecibido = (req.body.nombre || usuarioRecibido.split('@')[0]).trim();

    if (!usuarioRecibido || !claveRecibida) {
      return res.status(400).json({ mensaje: 'Completa usuario y clave' });
    }

    // Verificar que no exista en ninguna colección
    const query = {
      $or: [
        { usuario: new RegExp(`^${usuarioRecibido}$`, 'i') },
        { correo: new RegExp(`^${usuarioRecibido}$`, 'i') }
      ]
    };

    const [existeCli, existeEnc, existeAdm] = await Promise.all([
      clientesCollection.findOne(query),
      encargadosCollection.findOne(query),
      adminCollection.findOne(query)
    ]);

    if (existeCli || existeEnc || existeAdm) {
      return res.status(409).json({ mensaje: 'El usuario ya existe' });
    }

    const nuevoCliente = {
      id: 'CLI-' + Math.floor(100 + Math.random() * 900),
      nombre: nombreRecibido,
      usuario: usuarioRecibido,
      correo: usuarioRecibido,
      pass: claveRecibida,
      activo: true,
      fechaRegistro: new Date()
    };

    await clientesCollection.insertOne(nuevoCliente);
    res.status(201).json({ mensaje: 'Usuario registrado correctamente en Atlas', usuario: nuevoCliente });
  } catch (error) {
    res.status(500).json({ mensaje: 'No se pudo registrar el usuario: ' + error.message });
  }
});

// =============================================================================
// 2. ENDPOINTS CRUD DEL SISTEMA CYBERCATÉ (GATOS, PCs, PRECIOS, ENCARGADOS, ETC.)
// =============================================================================

// --- Gatos Acompañantes ---
app.get('/api/gatos', async (req, res) => {
  try {
    res.json(await db.collection('gatos').find({}).toArray());
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al consultar gatos' });
  }
});

app.post('/api/gatos', async (req, res) => {
  try {
    const { nombre, tipo } = req.body;
    if (!nombre || !tipo) return res.status(400).json({ mensaje: 'Faltan datos del gato' });

    const nuevoId = `CAT-${Date.now().toString().slice(-4)}`;
    const nuevoGato = {
      id: nuevoId,
      nombre: nombre,
      tipo: tipo,
      llego: "Sí",
      horario: "10:00 - 18:00",
      estado: "Disponible",
      asignacion: "Ninguna"
    };

    await db.collection('gatos').insertOne(nuevoGato);
    res.status(201).json({ mensaje: 'Gato registrado correctamente', id: nuevoId, gato: nuevoGato });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al agregar el gato' });
  }
});

app.put('/api/gatos/:id', async (req, res) => {
  try {
    const gatoId = req.params.id;
    const { nombre, tipo, estado, horario } = req.body;
    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (tipo) updateData.tipo = tipo;
    if (estado) updateData.estado = estado;
    if (horario) updateData.horario = horario;

    const resultado = await db.collection('gatos').updateOne(
      { id: gatoId },
      { $set: updateData }
    );

    if (resultado.matchedCount === 0) return res.status(404).json({ mensaje: 'Gato no encontrado' });
    res.json({ mensaje: 'Gato actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar el gato' });
  }
});

app.delete('/api/gatos/:id', async (req, res) => {
  try {
    const gatoId = req.params.id;
    const resultado = await db.collection('gatos').deleteOne({ id: gatoId });
    if (resultado.deletedCount === 0) return res.status(404).json({ mensaje: 'Gato no encontrado' });
    res.json({ mensaje: 'Gato eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar el gato' });
  }
});

// --- Equipos PCs ---
app.get('/api/pcs', async (req, res) => {
  try {
    res.json(await db.collection('pcs').find({}).toArray());
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al consultar PCs' });
  }
});

app.post('/api/pcs', async (req, res) => {
  try {
    const { id, estado, categoria } = req.body;
    if (!id || !estado) return res.status(400).json({ mensaje: 'Faltan datos del equipo' });

    const existe = await db.collection('pcs').findOne({ id: id });
    if (existe) return res.status(409).json({ mensaje: 'Este ID de PC ya existe' });

    const nuevoPC = { id, estado, categoria: categoria || "Estándar" };
    await db.collection('pcs').insertOne(nuevoPC);
    res.status(201).json({ mensaje: 'PC agregado correctamente', pc: nuevoPC });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al agregar el PC' });
  }
});

app.patch('/api/pcs/:id', async (req, res) => {
  try {
    const pcId = req.params.id;
    const pc = await db.collection('pcs').findOne({ id: pcId });
    if (!pc) return res.status(404).json({ mensaje: 'PC no encontrado' });

    const nuevoEstado = req.body.estado || (pc.estado === 'Disponible' ? 'Mantenimiento' : 'Disponible');
    await db.collection('pcs').updateOne({ id: pcId }, { $set: { estado: nuevoEstado } });
    res.json({ mensaje: 'Estado actualizado', nuevoEstado });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar el PC' });
  }
});

app.delete('/api/pcs/:id', async (req, res) => {
  try {
    const pcId = req.params.id;
    const resultado = await db.collection('pcs').deleteOne({ id: pcId });
    if (resultado.deletedCount === 0) return res.status(404).json({ mensaje: 'PC no encontrado' });
    res.json({ mensaje: 'PC eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar el PC' });
  }
});

// --- Precios y Tarifas ---
app.get('/api/precios', async (req, res) => {
  try {
    const precios = await db.collection('precios').findOne({});
    res.json(precios || {});
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al consultar precios' });
  }
});

app.post('/api/precios', async (req, res) => {
  try {
    const nuevosPrecios = req.body;
    await db.collection('precios').updateOne({}, { $set: nuevosPrecios }, { upsert: true });
    res.status(200).json({ mensaje: 'Lista de precios actualizada en Atlas' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar los precios' });
  }
});

// --- Encargados (Panel Admin) ---
app.get('/api/encargados', async (req, res) => {
  try {
    res.json(await encargadosCollection.find({}).toArray());
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al consultar encargados' });
  }
});

app.post('/api/encargados', async (req, res) => {
  try {
    const { nombre, correo, pass } = req.body;
    if (!nombre || !correo || !pass) return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });

    const correoNorm = correo.trim().toLowerCase();
    const existe = await encargadosCollection.findOne({ correo: correoNorm });
    if (existe) return res.status(409).json({ mensaje: 'El correo ya está registrado para un encargado' });

    const nuevoEncargado = {
      id: `ENC-${Date.now().toString().slice(-3)}`,
      nombre: nombre,
      correo: correoNorm,
      usuario: correoNorm,
      pass: pass,
      turno: "Por definir"
    };

    await encargadosCollection.insertOne(nuevoEncargado);
    res.status(201).json({ mensaje: 'Encargado registrado correctamente en Atlas', encargado: nuevoEncargado });
  } catch (error) {
    res.status(500).json({ mensaje: 'No se pudo registrar el encargado' });
  }
});

app.put('/api/encargados/:id', async (req, res) => {
  try {
    const cuentaId = req.params.id;
    const { nombre, correo, pass } = req.body;

    const resultado = await encargadosCollection.updateOne(
      { id: cuentaId },
      { $set: { nombre, correo: correo.trim().toLowerCase(), usuario: correo.trim().toLowerCase(), pass } }
    );

    if (resultado.matchedCount === 0) return res.status(404).json({ mensaje: 'Cuenta no encontrada' });
    res.json({ mensaje: 'Cuenta actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar la cuenta' });
  }
});

app.delete('/api/encargados/:id', async (req, res) => {
  try {
    const cuentaId = req.params.id;
    const resultado = await encargadosCollection.deleteOne({ id: cuentaId });
    if (resultado.deletedCount === 0) return res.status(404).json({ mensaje: 'Cuenta no encontrada' });
    res.json({ mensaje: 'Cuenta eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar la cuenta' });
  }
});

// --- Reservas y Cierres de Caja ---
app.get('/api/reservas', async (req, res) => {
  try {
    res.json(await db.collection('reservas').find({}).toArray());
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al consultar reservas' });
  }
});

app.post('/api/reservas', async (req, res) => {
  try {
    const nuevaReserva = req.body;
    await db.collection('reservas').insertOne(nuevaReserva);
    res.status(201).json({ mensaje: 'Reserva registrada', reserva: nuevaReserva });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al registrar reserva' });
  }
});

app.get('/api/cierres', async (req, res) => {
  try {
    res.json(await db.collection('cierres_caja').find({}).toArray());
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al consultar cierres' });
  }
});

app.post('/api/cierres', async (req, res) => {
  try {
    const nuevoCierre = req.body;
    await db.collection('cierres_caja').insertOne(nuevoCierre);
    res.status(201).json({ mensaje: 'Cierre registrado', cierre: nuevoCierre });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al registrar cierre' });
  }
});

// =============================================================================
// 3. INICIALIZACIÓN DEL SERVIDOR
// =============================================================================
async function iniciarServidor() {
  await cliente.connect();
  db = cliente.db('cybercate');

  clientesCollection = db.collection('clientes');
  encargadosCollection = db.collection('encargados');
  adminCollection = db.collection('administradores');

  console.log('Conectado exitosamente a MongoDB Atlas (Base: cybercate)');

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API CyberCaté escuchando en http://localhost:${PORT}`);
  });
}

iniciarServidor().catch(err => {
  console.error('Error al conectar con MongoDB Atlas:', err);
  process.exit(1);
});
