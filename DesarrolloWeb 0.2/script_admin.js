// ==========================================================================
// 1. NAVEGACIÓN Y MENÚ
// ==========================================================================
function abrirSeccion(idSeccion, nombreSeccion) {
    document.getElementById('menu-principal-admin').classList.remove('activo');
    document.getElementById('menu-principal-admin').classList.add('oculto');

    const secciones = document.querySelectorAll('.seccion-funcional');
    secciones.forEach(sec => {
        sec.classList.remove('activo');
        sec.classList.add('oculto');
    });

    const seccionActiva = document.getElementById(idSeccion);
    if (seccionActiva) {
        seccionActiva.classList.remove('oculto');
        seccionActiva.classList.add('activo');
    }

    document.getElementById('texto-ruta').innerText = ` : ${nombreSeccion}`;
    document.getElementById('btn-volver').classList.remove('oculto');
}

function volverAlMenu() {
    const secciones = document.querySelectorAll('.seccion-funcional');
    secciones.forEach(sec => {
        sec.classList.remove('activo');
        sec.classList.add('oculto');
    });

    document.getElementById('menu-principal-admin').classList.remove('oculto');
    document.getElementById('menu-principal-admin').classList.add('activo');
    document.getElementById('texto-ruta').innerText = '';
    document.getElementById('btn-volver').classList.add('oculto');
}

function toggleMenuPerfil() {
    const menu = document.getElementById('menu-perfil');
    if (menu) menu.classList.toggle('activo');
}

window.onclick = function(evento) {
    if (!evento.target.matches('.btn-perfil')) {
        const menus = document.getElementsByClassName('menu-desplegable');
        for (let i = 0; i < menus.length; i++) {
            if (menus[i].classList.contains('activo')) {
                menus[i].classList.remove('activo');
            }
        }
    }
}

function cerrarSesion() { window.location.href = 'index.html'; }
function irConfiguraciones() { alert("Abriendo configuraciones..."); }

// ==========================================================================
// 2. GESTIÓN DE EQUIPOS (PCs)
// ==========================================================================
let inventarioPCs = JSON.parse(localStorage.getItem('cybercate_pcs')) || [
    { id: 'PC 01', estado: 'Disponible' }, { id: 'PC 02', estado: 'Disponible' },
    { id: 'PC 03', estado: 'Disponible' }, { id: 'PC 04', estado: 'Mantenimiento' },
    { id: 'PC 05', estado: 'Disponible' }, { id: 'PC 06', estado: 'Disponible' },
    { id: 'PC 07', estado: 'Disponible' }, { id: 'PC 08', estado: 'Disponible' },
    { id: 'PC 09', estado: 'Disponible' }, { id: 'PC 10', estado: 'Mantenimiento' },
    { id: 'PC 11', estado: 'Disponible' }, { id: 'PC 12', estado: 'Disponible' }
];

function guardarCambiosEnStorage() {
    localStorage.setItem('cybercate_pcs', JSON.stringify(inventarioPCs));
}

function renderizarTablaPCs() {
    inventarioPCs = JSON.parse(localStorage.getItem('cybercate_pcs')) || inventarioPCs;
    const cuerpoTabla = document.getElementById('cuerpo-tabla-pcs');
    if (!cuerpoTabla) return;
    cuerpoTabla.innerHTML = '';
    const tabla = cuerpoTabla.closest('table');
    if(tabla) tabla.style.tableLayout = 'fixed';

    inventarioPCs.forEach(pc => {
        const fila = document.createElement('tr');
        let colorEstado = pc.estado === 'Disponible' ? '#2ecc71' : (pc.estado === 'Mantenimiento' ? '#f1c40f' : '#e74c3c');
        let textoEstado = pc.estado === 'Ocupado' ? (pc.cliente ? `Ocupado (${pc.cliente})` : 'Ocupado') : pc.estado;
        
        fila.innerHTML = `
            <td style="width: 30%;"><strong>${pc.id}</strong></td>
            <td style="width: 40%; color: ${colorEstado}; font-weight: bold;">${textoEstado}</td>
            <td style="width: 30%; display: flex; gap: 10px;">
                <button onclick="cambiarEstadoPC('${pc.id}')" style="background-color: #f39c12; margin: 0; padding: 8px;">Alternar</button>
                <button onclick="eliminarPC('${pc.id}')" style="background-color: #e74c3c; margin: 0; padding: 8px;">Eliminar</button>
            </td>
        `;
        cuerpoTabla.appendChild(fila);
    });
}

function agregarPC(evento) {
    evento.preventDefault();
    const nombre = document.getElementById('nuevo-nombre-pc').value.trim();
    const estado = document.getElementById('nuevo-estado-pc').value;

    if (inventarioPCs.find(pc => pc.id.toLowerCase() === nombre.toLowerCase())) {
        alert("Ya existe un equipo con ese nombre."); return;
    }
    inventarioPCs.push({ id: nombre, estado: estado });
    guardarCambiosEnStorage(); 
    alert(`Equipo ${nombre} agregado exitosamente.`);
    document.getElementById('nuevo-nombre-pc').value = '';
    renderizarTablaPCs();
}

function cambiarEstadoPC(id) {
    const pcIndex = inventarioPCs.findIndex(pc => pc.id === id);
    if (pcIndex !== -1) {
        if(inventarioPCs[pcIndex].estado === 'Ocupado') {
            alert("No puedes modificar un PC en uso."); return;
        }
        inventarioPCs[pcIndex].estado = inventarioPCs[pcIndex].estado === 'Disponible' ? 'Mantenimiento' : 'Disponible';
        guardarCambiosEnStorage(); renderizarTablaPCs();
    }
}

function eliminarPC(id) {
    const pcIndex = inventarioPCs.findIndex(pc => pc.id === id);
    if (pcIndex !== -1 && inventarioPCs[pcIndex].estado === 'Ocupado') {
        alert(`Alguien está ocupando el ${id}. No se puede eliminar.`); return;
    }
    if (confirm(`¿Eliminar el equipo ${id}?`)) {
        inventarioPCs = inventarioPCs.filter(pc => pc.id !== id);
        guardarCambiosEnStorage(); renderizarTablaPCs();
    }
}

// ==========================================================================
// 3. CONFIGURACIÓN DE PRECIOS GLOBALES 
// ==========================================================================
let preciosGlobales = JSON.parse(localStorage.getItem('cybercate_precios')) || {
    horaBase: 2500, horaExtra: 1000, gatoBase: 0, gatoExtra: 1500,
    bebida: 1200, snack: 800, imprimir: 150
};

function cargarPreciosEnFormulario() {
    const form = document.getElementById('form-precios');
    if (!form) return; 
    document.getElementById('precio-hora-base').value = preciosGlobales.horaBase || 2500;
    document.getElementById('precio-hora-extra').value = preciosGlobales.horaExtra || 1000;
    document.getElementById('precio-gato-base').value = preciosGlobales.gatoBase || 0;
    document.getElementById('precio-gato-extra').value = preciosGlobales.gatoExtra || 1500;
    document.getElementById('precio-bebida').value = preciosGlobales.bebida || 1200;
    document.getElementById('precio-snack').value = preciosGlobales.snack || 800;
    document.getElementById('precio-imprimir').value = preciosGlobales.imprimir || 150;
}

function guardarPrecios(evento) {
    evento.preventDefault(); 
    preciosGlobales = {
        horaBase: parseInt(document.getElementById('precio-hora-base').value) || 0,
        horaExtra: parseInt(document.getElementById('precio-hora-extra').value) || 0,
        gatoBase: parseInt(document.getElementById('precio-gato-base').value) || 0,
        gatoExtra: parseInt(document.getElementById('precio-gato-extra').value) || 0,
        bebida: parseInt(document.getElementById('precio-bebida').value) || 0,
        snack: parseInt(document.getElementById('precio-snack').value) || 0,
        imprimir: parseInt(document.getElementById('precio-imprimir').value) || 0 
    };
    localStorage.setItem('cybercate_precios', JSON.stringify(preciosGlobales));
    alert("¡Precios actualizados para todo el sistema!");
}

// ==========================================================================
// 4. GESTIÓN DE CUENTAS (ENCARGADOS)
// ==========================================================================
let cuentasEncargados = JSON.parse(localStorage.getItem('cybercate_encargados')) || [
    { id: 1, nombre: 'Encargado Principal', correo: 'encargado@mail.com', pass: '123' }
];

function guardarCuentasEnStorage() {
    localStorage.setItem('cybercate_encargados', JSON.stringify(cuentasEncargados));
}

function renderizarCuentas() {
    const cuerpo = document.getElementById('cuerpo-cuentas');
    if(!cuerpo) return;
    cuerpo.innerHTML = '';
    
    cuentasEncargados.forEach(cuenta => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><strong>${cuenta.nombre}</strong></td><td>${cuenta.correo}</td>
            <td style="display: flex; gap: 5px;">
                <button style="background-color: #3498db; padding: 8px; margin: 0; flex: 1;" onclick="abrirModalCuenta(${cuenta.id})">Modificar</button>
                <button style="background-color: #f39c12; padding: 8px; margin: 0; flex: 1;" onclick="desconectarCuenta('${cuenta.nombre}')">Desconectar</button>
                <button style="background-color: #e74c3c; padding: 8px; margin: 0; flex: 1;" onclick="eliminarCuenta(${cuenta.id}, '${cuenta.nombre}')">Eliminar</button>
            </td>
        `;
        cuerpo.appendChild(fila);
    });
}

function agregarCuenta(evento) {
    evento.preventDefault();
    const nombre = document.getElementById('nuevo-nombre-cuenta').value.trim();
    const correo = document.getElementById('nuevo-correo-cuenta').value.trim().toLowerCase();
    const pass = document.getElementById('nueva-pass-cuenta').value.trim();

    if(cuentasEncargados.find(c => c.correo === correo)) {
        alert("Ya existe una cuenta con este correo."); return;
    }
    cuentasEncargados.push({ id: Date.now(), nombre: nombre, correo: correo, pass: pass });
    guardarCuentasEnStorage(); renderizarCuentas();
    document.getElementById('form-crear-cuenta').reset();
    alert(`Cuenta de "${nombre}" creada.`);
}

function eliminarCuenta(id, nombre) {
    if(confirm(`¿ELIMINAR la cuenta de "${nombre}"?`)) {
        cuentasEncargados = cuentasEncargados.filter(c => c.id !== id);
        guardarCuentasEnStorage(); renderizarCuentas();
    }
}

function desconectarCuenta(nombre) {
    alert(`[Señal enviada]\nCierre de sesión remoto forzado para: ${nombre}.`);
}

function abrirModalCuenta(id) {
    const cuenta = cuentasEncargados.find(c => c.id === id);
    if(cuenta) {
        document.getElementById('modal-cuenta-id').value = cuenta.id;
        document.getElementById('modal-cuenta-nombre').value = cuenta.nombre;
        document.getElementById('modal-cuenta-correo').value = cuenta.correo;
        document.getElementById('modal-cuenta-pass').value = cuenta.pass;
        document.getElementById('modal-editar-cuenta').classList.remove('oculto');
    }
}

function cerrarModalCuenta() { document.getElementById('modal-editar-cuenta').classList.add('oculto'); }

function guardarEdicionCuenta() {
    const id = parseInt(document.getElementById('modal-cuenta-id').value);
    const nombre = document.getElementById('modal-cuenta-nombre').value.trim();
    const correo = document.getElementById('modal-cuenta-correo').value.trim().toLowerCase();
    const pass = document.getElementById('modal-cuenta-pass').value.trim();

    const index = cuentasEncargados.findIndex(c => c.id === id);
    if(index !== -1) {
        if(cuentasEncargados.find(c => c.correo === correo && c.id !== id)) {
            alert("Este correo ya está en uso."); return;
        }
        cuentasEncargados[index] = { ...cuentasEncargados[index], nombre, correo, pass };
        guardarCuentasEnStorage(); renderizarCuentas(); cerrarModalCuenta();
        alert("Datos actualizados correctamente.");
    }
}

// ==========================================================================
// 5. GESTIÓN DE ACOMPAÑANTES (GATOS)
// ==========================================================================
let inventarioGatos = JSON.parse(localStorage.getItem('cybercate_gatos')) || [
    { id: 1, nombre: 'Estrella', tipo: 'Siamesa', llego: 'Sí', horario: '09:00 - 15:00', estado: 'Disponible', asignacion: 'Ninguna' },
    { id: 2, nombre: 'Simba', tipo: 'Naranja/Atigrado', llego: 'Sí', horario: '10:00 - 16:00', estado: 'Disponible', asignacion: 'Ninguna' }
];

function guardarGatosEnStorage() {
    localStorage.setItem('cybercate_gatos', JSON.stringify(inventarioGatos));
}

// NUEVO: SISTEMA DE AUTO-LIMPIEZA DE GATOS FANTASMA PARA EL ADMIN
function limpiarGatosFantasmaAdmin() {
    let pcsActuales = JSON.parse(localStorage.getItem('cybercate_pcs')) || [];
    let modificados = false;
    inventarioGatos.forEach(gato => {
        if (gato.estado === 'Ocupado') {
            let estaEnUso = pcsActuales.some(pc => {
                if (pc.estado !== 'Ocupado' || !pc.gato) return false;
                let gatosDelPC = pc.gato.split(', ');
                return gatosDelPC.includes(gato.nombre);
            });
            if (!estaEnUso) {
                gato.estado = 'Disponible';
                gato.asignacion = 'Ninguna';
                modificados = true;
            }
        }
    });
    if (modificados) guardarGatosEnStorage();
}

function renderizarGatos() {
    inventarioGatos = JSON.parse(localStorage.getItem('cybercate_gatos')) || inventarioGatos;
    limpiarGatosFantasmaAdmin(); // Limpia los datos corruptos al abrir la pestaña

    const cuerpo = document.getElementById('cuerpo-gatos-admin');
    if(!cuerpo) return;
    cuerpo.innerHTML = '';

    inventarioGatos.forEach(gato => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><strong>${gato.nombre}</strong></td><td>${gato.tipo}</td>
            <td style="display: flex; gap: 5px;">
                <button style="background-color: #3498db; padding: 8px; margin: 0; flex: 1;" onclick="abrirModalGato(${gato.id})">Modificar</button>
                <button style="background-color: #e74c3c; padding: 8px; margin: 0; flex: 1;" onclick="eliminarGato(${gato.id}, '${gato.nombre}')">Eliminar</button>
            </td>
        `;
        cuerpo.appendChild(fila);
    });
}

function agregarGato(evento) {
    evento.preventDefault();
    const nombre = document.getElementById('nuevo-nombre-gato').value.trim();
    const tipo = document.getElementById('nuevo-tipo-gato').value.trim();

    if(inventarioGatos.find(g => g.nombre.toLowerCase() === nombre.toLowerCase())) {
        alert("Ya existe un acompañante con este nombre."); return;
    }
    inventarioGatos.push({
        id: Date.now(), nombre: nombre, tipo: tipo, llego: 'Sí', 
        horario: '09:00 - 15:00', estado: 'Disponible', asignacion: 'Ninguna'
    });
    guardarGatosEnStorage(); renderizarGatos();
    document.getElementById('form-crear-gato').reset();
    alert(`Acompañante "${nombre}" registrado.`);
}

function eliminarGato(id, nombre) {
    if (inventarioGatos.find(g => g.id === id)?.estado === 'Ocupado') {
        alert(`${nombre} está acompañando a un cliente. Libéralo primero.`); return;
    }
    if(confirm(`¿ELIMINAR a "${nombre}" del registro?`)) {
        inventarioGatos = inventarioGatos.filter(g => g.id !== id);
        guardarGatosEnStorage(); renderizarGatos();
    }
}

function abrirModalGato(id) {
    const gato = inventarioGatos.find(g => g.id === id);
    if(gato) {
        document.getElementById('modal-gato-id-admin').value = gato.id;
        document.getElementById('modal-gato-nombre-admin').value = gato.nombre;
        document.getElementById('modal-gato-tipo-admin').value = gato.tipo;
        document.getElementById('modal-editar-gato').classList.remove('oculto');
    }
}
function cerrarModalGato() { document.getElementById('modal-editar-gato').classList.add('oculto'); }

function guardarEdicionGato() {
    const id = parseInt(document.getElementById('modal-gato-id-admin').value);
    const nombre = document.getElementById('modal-gato-nombre-admin').value.trim();
    const tipo = document.getElementById('modal-gato-tipo-admin').value.trim();
    const index = inventarioGatos.findIndex(g => g.id === id);
    
    if(index !== -1) {
        if(inventarioGatos.find(g => g.nombre.toLowerCase() === nombre.toLowerCase() && g.id !== id)) {
            alert("Ya existe otro acompañante usando ese nombre."); return;
        }
        inventarioGatos[index].nombre = nombre; inventarioGatos[index].tipo = tipo;
        guardarGatosEnStorage(); renderizarGatos(); cerrarModalGato();
        alert("Acompañante actualizado.");
    }
}

// ==========================================================================
// 6. GESTIÓN DE GANANCIAS (HISTORIAL FINANCIERO)
// ==========================================================================
function renderizarGanancias() {
    const historialCierres = JSON.parse(localStorage.getItem('cybercate_cierres')) || [];
    const cuerpo = document.getElementById('cuerpo-ganancias');
    if(!cuerpo) return;
    cuerpo.innerHTML = '';

    // Invierte el array para mostrar los más recientes arriba
    historialCierres.slice().reverse().forEach(cierre => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${cierre.fecha}</td>
            <td><strong>${cierre.correo}</strong></td>
            <td style="text-align: center;">${cierre.clientes}</td>
            <td style="color: #2ecc71; font-weight: bold;">$${cierre.total.toLocaleString()}</td>
        `;
        cuerpo.appendChild(fila);
    });
}

// ==========================================================================
// 7. INICIALIZACIÓN (Carga todas las tablas al abrir)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (typeof renderizarTablaPCs === 'function') renderizarTablaPCs();
    if (typeof cargarPreciosEnFormulario === 'function') cargarPreciosEnFormulario();
    if (typeof renderizarCuentas === 'function') renderizarCuentas();
    if (typeof renderizarGatos === 'function') renderizarGatos();
    if (typeof renderizarGanancias === 'function') renderizarGanancias();
});