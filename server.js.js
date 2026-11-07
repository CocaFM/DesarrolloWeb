const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

// Cadena de conexión hacia tu clúster de MongoDB Atlas
const uri = "mongodb+srv://vicentevalenzuela3_db_user:d88Psnpq3NXarIz4@cluster0.0usjlfc.mongodb.net/cybercate?retryWrites=true&w=majority";
const cliente = new MongoClient(uri);

let db;
let clientesCollection;
let encargadosCollection;
let adminCollection;

// --- RÚBRICA 1: Obtener todos los usuarios unificados ---
app.get('/api/usuarios', async (req, res) => {
  try {
    const [clientes, encargados, admins] = await Promise.all([
      clientesCollection.find({}).toArray(),
      encargadosCollection.find({}).toArray(),
      adminCollection.find({}).toArray()
    ]);

    const listaUnificada = [
      ...clientes.map(u => ({ id: u._id, nombre: u.nombre || u.usuario, usuario: u.usuario || u.correo, rol: 'cliente', activo: true })),
      ...encargados.map(u => ({ id: u._id, nombre: u.nombre || u.usuario, usuario: u.usuario || u.correo, rol: 'encargado', activo: true })),
      ...admins.map(u => ({ id: u._id, nombre: u.nombre || u.usuario, usuario: u.usuario || u.correo, rol: 'administrador', activo: true }))
    ];

    res.json(listaUnificada);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al consultar usuarios en Atlas' });
  }
});

// --- RÚBRICA 2: Login de usuarios ---
app.post('/api/login', async (req, res) => {
  try {
    const { usuario, clave } = req.body;
    const userQuery = usuario?.trim().toLowerCase();

    if (!userQuery || !clave) {
      return res.status(400).json({ mensaje: 'Completa usuario y clave' });
    }

    // Buscar en las 3 colecciones
    const clienteEncontrado = await clientesCollection.findOne({ 
      $or: [{ usuario: new RegExp(`^${userQuery}$`, 'i') }, { correo: new RegExp(`^${userQuery}$`, 'i') }] 
    });
    const encargadoEncontrado = await encargadosCollection.findOne({ 
      $or: [{ usuario: new RegExp(`^${userQuery}$`, 'i') }, { correo: new RegExp(`^${userQuery}$`, 'i') }] 
    });
    const adminEncontrado = await adminCollection.findOne({ 
      $or: [{ usuario: new RegExp(`^${userQuery}$`, 'i') }, { correo: new RegExp(`^${userQuery}$`, 'i') }] 
    });

    const encontrado = clienteEncontrado || encargadoEncontrado || adminEncontrado;
    const rol = clienteEncontrado ? 'cliente' : (encargadoEncontrado ? 'encargado' : 'administrador');

    if (encontrado && (encontrado.clave === clave || encontrado.password === clave)) {
      return res.json({ mensaje: 'Acceso aceptado.', nombre: encontrado.nombre || encontrado.usuario, rol });
    }

    res.status(401).json({ mensaje: 'Usuario o clave incorrectos' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error durante el inicio de sesión' });
  }
});

// --- RÚBRICA 3: Registro de nuevos usuarios ---
app.post('/api/registro', async (req, res) => {
  try {
    const { usuario, clave, nombre } = req.body;
    if (!usuario || !clave) {
      return res.status(400).json({ mensaje: 'Completa usuario y clave' });
    }

    const usuarioNorm = usuario.trim().toLowerCase();
    
    // Verificar duplicados en colecciones
    const existe = await clientesCollection.findOne({ 
      $or: [{ usuario: usuarioNorm }, { correo: usuarioNorm }] 
    });

    if (existe) {
      return res.status(409).json({ mensaje: 'El usuario ya existe' });
    }

    await clientesCollection.insertOne({
      nombre: nombre || usuario,
      usuario: usuarioNorm,
      clave: clave,
      activo: true,
      fechaRegistro: new Date()
    });

    res.status(201).json({ mensaje: 'Usuario registrado correctamente en Atlas' });
  } catch (error) {
    res.status(500).json({ mensaje: 'No se pudo registrar el usuario' });
  }
});

// --- Endpoints del sistema CyberCaté ---
app.get('/api/gatos', async (req, res) => res.json(await db.collection('gatos').find({}).toArray()));
app.get('/api/pcs', async (req, res) => res.json(await db.collection('pcs').find({}).toArray()));
app.get('/api/precios', async (req, res) => res.json(await db.collection('precios').find({}).toArray()));
app.get('/api/reservas', async (req, res) => res.json(await db.collection('reservas').find({}).toArray()));
app.get('/api/cierres', async (req, res) => res.json(await db.collection('cierres_caja').find({}).toArray()));
// --- POST: Registro de Encargados (Panel Admin) ---
app.post('/api/encargados', async (req, res) => {
  try {
    const { nombre, correo, pass } = req.body;
    
    if (!nombre || !correo || !pass) {
      return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
    }

    const correoNorm = correo.trim().toLowerCase();

    // Verificar si el encargado ya existe usando la colección global
    const existe = await encargadosCollection.findOne({ correo: correoNorm });
    if (existe) {
      return res.status(409).json({ mensaje: 'El correo ya está registrado para un encargado' });
    }

    // Insertar el nuevo encargado
    await encargadosCollection.insertOne({
      id: `ENC-${Date.now().toString().slice(-3)}`, // Genera un ID dinámico corto
      nombre: nombre,
      correo: correoNorm,
      pass: pass,
      turno: "Por definir"
    });

    res.status(201).json({ mensaje: 'Encargado registrado correctamente en Atlas' });
  } catch (error) {
    res.status(500).json({ mensaje: 'No se pudo registrar el encargado' });
  }
});

// --- POST: Actualizar Precios (Panel Admin) ---
app.post('/api/precios', async (req, res) => {
  try {
    const nuevosPrecios = req.body;
    
    // updateOne con el filtro vacío {} modificará el primer (y único) documento de precios. 
    // upsert: true creará el documento si la colección está vacía.
    await db.collection('precios').updateOne(
      {}, 
      { $set: nuevosPrecios },
      { upsert: true }
    );
    
    res.status(200).json({ mensaje: 'Lista de precios actualizada en Atlas' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar los precios' });
  }
});
// --- Inicialización del Servidor ---
async function iniciarServidor() {
  await cliente.connect();
  db = cliente.db('cybercate');
  
  clientesCollection = db.collection('clientes');
  encargadosCollection = db.collection('encargados');
  adminCollection = db.collection('administradores');

  console.log('Conectado exitosamente a MongoDB Atlas');

  app.listen(3000, '127.0.0.1', () => {
    console.log('API escuchando en http://127.0.0.1:3000');
  });
}

iniciarServidor().catch(err => {
  console.error('Error al conectar con MongoDB Atlas:', err);
  process.exit(1);
});