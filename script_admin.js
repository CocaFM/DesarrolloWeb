
// ==========================================================================
// 1. NAVEGACIÓN ENTRE SUBPÁGINAS Y MENÚ PRINCIPAL

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

// ==========================================================================
// 2. MENÚ DE PERFIL Y GESTIÓN DE SESIÓN

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

function cerrarSesion() {
    window.location.href = 'index.html';
}

function irConfiguraciones() {
    alert("Abriendo opciones de configuración del Administrador...");
}
// ==========================================================================
// 3. GESTIÓN DE EQUIPOS (PCs) - CONECTADO CON ENCARGADO

let inventarioPCs = JSON.parse(localStorage.getItem('cybercate_pcs')) || [
    { id: 'PC 01', estado: 'Disponible' },
    { id: 'PC 02', estado: 'Disponible' },
    { id: 'PC 03', estado: 'Disponible' },
    { id: 'PC 04', estado: 'Mantenimiento' },
    { id: 'PC 05', estado: 'Disponible' },
    { id: 'PC 06', estado: 'Disponible' },
    { id: 'PC 07', estado: 'Disponible' },
    { id: 'PC 08', estado: 'Disponible' },
    { id: 'PC 09', estado: 'Disponible' },
    { id: 'PC 10', estado: 'Mantenimiento' },
    { id: 'PC 11', estado: 'Disponible' },
    { id: 'PC 12', estado: 'Disponible' }
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
        
        let textoEstado = pc.estado;
        if (pc.estado === 'Ocupado') {
            textoEstado = pc.cliente ? `Ocupado (${pc.cliente})` : 'Ocupado';
        }
        
        fila.innerHTML = `
            <td style="width: 30%;"><strong>${pc.id}</strong></td>
            <td style="width: 40%; color: ${colorEstado}; font-weight: bold;">${textoEstado}</td>
            <td style="width: 30%; display: flex; gap: 10px;">
                <button onclick="cambiarEstadoPC('${pc.id}')" style="background-color: #f39c12; margin: 0; padding: 8px;">Alternar Estado</button>
                <button onclick="eliminarPC('${pc.id}')" style="background-color: #e74c3c; margin: 0; padding: 8px;">Eliminar</button>
            </td>
        `;
        cuerpoTabla.appendChild(fila);
    });
}


function agregarPC(evento) {
    evento.preventDefault();
    const inputNombre = document.getElementById('nuevo-nombre-pc');
    const selectEstado = document.getElementById('nuevo-estado-pc');
    
    const nombre = inputNombre.value.trim();
    const estado = selectEstado.value;

    const pcExistente = inventarioPCs.find(pc => pc.id.toLowerCase() === nombre.toLowerCase());
    if (pcExistente) {
        alert("Ya existe un equipo registrado con ese nombre.");
        return;
    }

    inventarioPCs.push({ id: nombre, estado: estado });
    guardarCambiosEnStorage(); 
    alert(`El equipo ${nombre} ha sido agregado exitosamente.`);
    
    inputNombre.value = '';
    renderizarTablaPCs();
}

function cambiarEstadoPC(id) {
    const pcIndex = inventarioPCs.findIndex(pc => pc.id === id);
    if (pcIndex !== -1) {
        if(inventarioPCs[pcIndex].estado === 'Ocupado') {
            alert("No puedes modificar un PC que está siendo usado por un cliente.");
            return;
        }
        
        const estadoActual = inventarioPCs[pcIndex].estado;
        inventarioPCs[pcIndex].estado = estadoActual === 'Disponible' ? 'Mantenimiento' : 'Disponible';
        guardarCambiosEnStorage();
        renderizarTablaPCs();
    }
}

function eliminarPC(id) {
    const pcIndex = inventarioPCs.findIndex(pc => pc.id === id);
    if (pcIndex !== -1 && inventarioPCs[pcIndex].estado === 'Ocupado') {
        alert(`¡Advertencia! Alguien está ocupando el ${id}. No se puede eliminar el equipo hasta que la sesión termine.`);
        return;
    }

    if (confirm(`¿Estás seguro de eliminar el equipo ${id}?`)) {
        inventarioPCs = inventarioPCs.filter(pc => pc.id !== id);
        guardarCambiosEnStorage(); 
        renderizarTablaPCs();
    }
}

document.addEventListener('DOMContentLoaded', renderizarTablaPCs);
// ==========================================================================
// 4. CONFIGURACIÓN DE PRECIOS GLOBALES

let preciosGlobales = JSON.parse(localStorage.getItem('cybercate_precios')) || {
    horaBase: 2500,
    horaExtra: 1000,
    gatoBase: 0,
    gatoExtra: 1500,
    bebida: 1200,
    snack: 800,
    imprimir: 500
};


function cargarPreciosEnFormulario() {
    const form = document.getElementById('form-precios');
    if (!form) return; 

    document.getElementById('precio-hora-base').value = preciosGlobales.horaBase;
    document.getElementById('precio-hora-extra').value = preciosGlobales.horaExtra;
    document.getElementById('precio-gato-base').value = preciosGlobales.gatoBase;
    document.getElementById('precio-gato-extra').value = preciosGlobales.gatoExtra;
    document.getElementById('precio-bebida').value = preciosGlobales.bebida;
    document.getElementById('precio-snack').value = preciosGlobales.snack;
}


function guardarPrecios(evento) {
    evento.preventDefault(); 
    
    preciosGlobales = {
        horaBase: parseInt(document.getElementById('precio-hora-base').value),
        horaExtra: parseInt(document.getElementById('precio-hora-extra').value),
        gatoBase: parseInt(document.getElementById('precio-gato-base').value),
        gatoExtra: parseInt(document.getElementById('precio-gato-extra').value),
        bebida: parseInt(document.getElementById('precio-bebida').value),
        snack: parseInt(document.getElementById('precio-snack').value)
    };

    localStorage.setItem('cybercate_precios', JSON.stringify(preciosGlobales));
    alert("¡Los precios se han actualizado y guardado correctamente para todo el sistema!");
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof renderizarTablaPCs === 'function') renderizarTablaPCs();
    cargarPreciosEnFormulario(); 
});

// ==========================================================================
// 5. GESTIÓN DE CUENTAS Y CONEXIÓN CON 1 pantalla

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
            <td><strong>${cuenta.nombre}</strong></td>
            <td>${cuenta.correo}</td>
            <td style="display: flex; gap: 5px;">
                <button style="background-color: #3498db; padding: 8px; margin: 0; flex: 1; font-size: 13px;" onclick="abrirModalCuenta(${cuenta.id})">Modificar</button>
                <button style="background-color: #f39c12; padding: 8px; margin: 0; flex: 1; font-size: 13px;" onclick="desconectarCuenta('${cuenta.nombre}')">Desconectar</button>
                <button style="background-color: #e74c3c; padding: 8px; margin: 0; flex: 1; font-size: 13px;" onclick="eliminarCuenta(${cuenta.id}, '${cuenta.nombre}')">Eliminar</button>
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
        alert("Error: Ya existe una cuenta asociada a este correo electrónico.");
        return;
    }

    cuentasEncargados.push({
        id: Date.now(),
        nombre: nombre,
        correo: correo,
        pass: pass
    });

    guardarCuentasEnStorage();
    renderizarCuentas();
    document.getElementById('form-crear-cuenta').reset();
    alert(`La cuenta del encargado "${nombre}" fue creada exitosamente.`);
}

function eliminarCuenta(id, nombre) {
    if(confirm(`¿Estás seguro de ELIMINAR la cuenta de "${nombre}"?\nEsta persona ya no podrá ingresar al sistema.`)) {
        cuentasEncargados = cuentasEncargados.filter(c => c.id !== id);
        guardarCuentasEnStorage();
        renderizarCuentas();
    }
}

function desconectarCuenta(nombre) {
    alert(`[Señal enviada]\nSe ha forzado el cierre de sesión remoto para el encargado: ${nombre}.`);
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

function cerrarModalCuenta() {
    document.getElementById('modal-editar-cuenta').classList.add('oculto');
}

function guardarEdicionCuenta() {
    const id = parseInt(document.getElementById('modal-cuenta-id').value);
    const nombre = document.getElementById('modal-cuenta-nombre').value.trim();
    const correo = document.getElementById('modal-cuenta-correo').value.trim().toLowerCase();
    const pass = document.getElementById('modal-cuenta-pass').value.trim();

    const index = cuentasEncargados.findIndex(c => c.id === id);
    if(index !== -1) {

        const correoOcupado = cuentasEncargados.find(c => c.correo === correo && c.id !== id);
        if(correoOcupado) {
            alert("Error: Este correo electrónico ya lo está usando otra cuenta.");
            return;
        }

        cuentasEncargados[index].nombre = nombre;
        cuentasEncargados[index].correo = correo;
        cuentasEncargados[index].pass = pass;

        guardarCuentasEnStorage();
        renderizarCuentas();
        cerrarModalCuenta();
        alert("Datos y contraseña actualizados correctamente.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof renderizarCuentas === 'function') renderizarCuentas();
});


// ==========================================================================
// 6. GESTIÓN DE ACOMPAÑANTES

let inventarioGatos = JSON.parse(localStorage.getItem('cybercate_gatos')) || [
    { id: 1, nombre: 'Estrella', tipo: 'Siamesa', llego: 'Sí', horario: '09:00 - 15:00', estado: 'Disponible', asignacion: 'Ninguna' },
    { id: 2, nombre: 'Simba', tipo: 'Naranja/Atigrado', llego: 'Sí', horario: '10:00 - 16:00', estado: 'Disponible', asignacion: 'Ninguna' },
    { id: 3, nombre: 'Oreo', tipo: 'Blanco y Negro', llego: 'Sí', horario: '14:00 - 20:00', estado: 'Disponible', asignacion: 'Ninguna' },
    { id: 4, nombre: 'Mochi', tipo: 'Persa', llego: 'Sí', horario: '09:00 - 14:00', estado: 'Disponible', asignacion: 'Ninguna' },
    { id: 5, nombre: 'Tory', tipo: 'Negro Pelo Largo', llego: 'Sí', horario: '15:00 - 22:00', estado: 'Disponible', asignacion: 'Ninguna' },
    { id: 6, nombre: 'Milo', tipo: 'Carey', llego: 'Sí', horario: '12:00 - 18:00', estado: 'Disponible', asignacion: 'Ninguna' },
    { id: 7, nombre: 'Garfield', tipo: 'Maine Coon', llego: 'No', horario: '16:00 - 00:00', estado: 'No disponible', asignacion: 'Ninguna' },
    { id: 8, nombre: 'Salem', tipo: 'Bombay (Negro)', llego: 'Sí', horario: '18:00 - 00:00', estado: 'Disponible', asignacion: 'Ninguna' },
    { id: 9, nombre: 'Bella', tipo: 'Calicó', llego: 'Sí', horario: '10:00 - 17:00', estado: 'Disponible', asignacion: 'Ninguna' },
    { id: 10, nombre: 'Loki', tipo: 'Sphynx (Sin pelo)', llego: 'Sí', horario: '13:00 - 21:00', estado: 'Disponible', asignacion: 'Ninguna' },
    { id: 11, nombre: 'Cleo', tipo: 'Bengala', llego: 'Sí', horario: '17:00 - 23:00', estado: 'Disponible', asignacion: 'Ninguna' },
    { id: 12, nombre: 'Nieve', tipo: 'Angora Blanco', llego: 'Sí', horario: '09:00 - 13:00', estado: 'Disponible', asignacion: 'Ninguna' }
];

function guardarGatosEnStorage() {
    localStorage.setItem('cybercate_gatos', JSON.stringify(inventarioGatos));
}

function renderizarGatos() {
    inventarioGatos = JSON.parse(localStorage.getItem('cybercate_gatos')) || inventarioGatos;
    const cuerpo = document.getElementById('cuerpo-gatos-admin');
    if(!cuerpo) return;
    cuerpo.innerHTML = '';

    inventarioGatos.forEach(gato => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><strong>${gato.nombre}</strong></td>
            <td>${gato.tipo}</td>
            <td style="display: flex; gap: 5px;">
                <button style="background-color: #3498db; padding: 8px; margin: 0; flex: 1; font-size: 13px;" onclick="abrirModalGato(${gato.id})">Modificar</button>
                <button style="background-color: #e74c3c; padding: 8px; margin: 0; flex: 1; font-size: 13px;" onclick="eliminarGato(${gato.id}, '${gato.nombre}')">Eliminar</button>
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
        alert("Error: Ya existe un acompañante registrado con ese nombre.");
        return;
    }

    inventarioGatos.push({
        id: Date.now(),
        nombre: nombre,
        tipo: tipo,
        llego: 'Sí',
        horario: '09:00 - 15:00',
        estado: 'Disponible',
        asignacion: 'Ninguna'
    });

    guardarGatosEnStorage();
    renderizarGatos();
    document.getElementById('form-crear-gato').reset();
    alert(`El acompañante "${nombre}" fue registrado exitosamente.`);
}

function eliminarGato(id, nombre) {
    const gatoActual = inventarioGatos.find(g => g.id === id);
    if (gatoActual && gatoActual.estado === 'Ocupado') {
        alert(`¡Advertencia! ${nombre} está acompañando a un cliente en este momento. No se puede eliminar de la base de datos hasta que se libere la sesión.`);
        return;
    }

    if(confirm(`¿Estás seguro de ELIMINAR a "${nombre}" del registro?`)) {
        inventarioGatos = inventarioGatos.filter(g => g.id !== id);
        guardarGatosEnStorage();
        renderizarGatos();
    }
}

// ---- LÓGICA DEL MODAL DE EDICIÓN-GATOS ----
function abrirModalGato(id) {
    const gato = inventarioGatos.find(g => g.id === id);
    if(gato) {
        document.getElementById('modal-gato-id-admin').value = gato.id;
        document.getElementById('modal-gato-nombre-admin').value = gato.nombre;
        document.getElementById('modal-gato-tipo-admin').value = gato.tipo;
        document.getElementById('modal-editar-gato').classList.remove('oculto');
    }
}

function cerrarModalGato() {
    document.getElementById('modal-editar-gato').classList.add('oculto');
}

function guardarEdicionGato() {
    const id = parseInt(document.getElementById('modal-gato-id-admin').value);
    const nombre = document.getElementById('modal-gato-nombre-admin').value.trim();
    const tipo = document.getElementById('modal-gato-tipo-admin').value.trim();

    const index = inventarioGatos.findIndex(g => g.id === id);
    if(index !== -1) {
        const nombreOcupado = inventarioGatos.find(g => g.nombre.toLowerCase() === nombre.toLowerCase() && g.id !== id);
        if(nombreOcupado) {
            alert("Error: Ya existe otro acompañante usando ese nombre.");
            return;
        }

        inventarioGatos[index].nombre = nombre;
        inventarioGatos[index].tipo = tipo;

        guardarGatosEnStorage();
        renderizarGatos();
        cerrarModalGato();
        alert("Datos del acompañante actualizados correctamente.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof renderizarTablaPCs === 'function') renderizarTablaPCs();
    if (typeof cargarPreciosEnFormulario === 'function') cargarPreciosEnFormulario();
    if (typeof renderizarCuentas === 'function') renderizarCuentas();
    if (typeof renderizarGatos === 'function') renderizarGatos();
});