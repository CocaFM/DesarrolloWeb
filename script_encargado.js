// ==========================================
// MEMORIA TEMPORAL
// ==========================================
let registroClientes = [];

// Base de datos de los gatos
let estadoGatos = [
    { id: 1, nombre: 'Luna', tipo: 'Siamesa', llego: 'Sí', horario: '09:00 - 15:00', estado: 'Disponible', asignacion: 'Ninguna' },
    { id: 2, nombre: 'Simba', tipo: 'Naranja/Atigrado', llego: 'Sí', horario: '10:00 - 18:00', estado: 'Disponible', asignacion: 'Ninguna' },
    { id: 3, nombre: 'Oreo', tipo: 'Blanco y Negro', llego: 'No', horario: '14:00 - 20:00', estado: 'No disponible', asignacion: 'Ninguna' },
    { id: 4, nombre: 'Mochi', tipo: 'Persa', llego: 'Sí', horario: '09:00 - 17:00', estado: 'Disponible', asignacion: 'Ninguna' }
];

let estadoPCs = [
    { id: 'PC 01', estado: 'Disponible' },
    { id: 'PC 02', estado: 'Disponible' },
    { id: 'PC 03', estado: 'Disponible' },
    { id: 'PC 04', estado: 'Mantenimiento' }
];

// ==========================================
// NAVEGACIÓN ENTRE SUBPÁGINAS
// ==========================================

function abrirSeccion(idSeccion, nombreSeccion) {
    document.getElementById('menu-principal-encargado').classList.remove('activo');
    document.getElementById('menu-principal-encargado').classList.add('oculto');

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

    // Cargar datos dinámicos según la vista
    if (idSeccion === 'sec-agregar-cliente') cargarOpcionesGatos();
    if (idSeccion === 'sec-estado-acompanantes') actualizarTablaGatos();
    if (idSeccion === 'sec-estados') actualizarVistaPCs();
    if (idSeccion === 'sec-historial') actualizarTablaHistorial();
    if (idSeccion === 'sec-cierre-caja') actualizarCierreCaja();
}

function volverAlMenu() {
    const secciones = document.querySelectorAll('.seccion-funcional');
    secciones.forEach(sec => {
        sec.classList.remove('activo');
        sec.classList.add('oculto');
    });

    document.getElementById('menu-principal-encargado').classList.remove('oculto');
    document.getElementById('menu-principal-encargado').classList.add('activo');

    document.getElementById('texto-ruta').innerText = '';
    document.getElementById('btn-volver').classList.add('oculto');
}

// ==========================================
// GESTIÓN DE CLIENTES Y GATOS
// ==========================================

function cargarOpcionesGatos() {
    const selectGato = document.getElementById('gato-cli');
    selectGato.innerHTML = '<option value="">Ninguno</option>';
    
    estadoGatos.forEach(gato => {
        if (gato.estado === 'Disponible') {
            const opcion = document.createElement('option');
            opcion.value = gato.nombre;
            opcion.textContent = `${gato.nombre} (${gato.tipo})`;
            selectGato.appendChild(opcion);
        }
    });
}

function guardarClienteTemporal(evento) {
    evento.preventDefault();

    const nombre = document.getElementById('nombre-cli').value;
    const pcSelect = document.getElementById('pc-cli').value;
    const horas = document.getElementById('horas-cli').value;
    const nombreGato = document.getElementById('gato-cli').value;
    const monto = document.getElementById('monto-cli').value;

    // Actualizar estado del gato si se seleccionó uno
    if (nombreGato !== "") {
        const gatoIndex = estadoGatos.findIndex(g => g.nombre === nombreGato);
        if (gatoIndex !== -1) {
            estadoGatos[gatoIndex].estado = 'Ocupado';
            estadoGatos[gatoIndex].asignacion = `Cliente: ${nombre} | ${pcSelect}`;
        }
    }

    // Actualizar estado del PC
    const pcIndex = estadoPCs.findIndex(p => p.id === pcSelect);
    if(pcIndex !== -1) {
        estadoPCs[pcIndex].estado = 'Ocupado';
    }

    registroClientes.push({
        nombre: nombre,
        pc: pcSelect,
        gato: nombreGato || 'Sin acompañante',
        horas: horas,
        monto: parseFloat(monto) || 0,
        activo: true // <-- Corrección: Se agregó la coma en la línea anterior
    });

    alert(`Cliente registrado. PC asignado: ${pcSelect}.`);
    document.getElementById('form-cliente').reset();
    cargarOpcionesGatos(); // Recargar selectores
}

function actualizarTablaGatos() {
    const cuerpoGatos = document.getElementById('cuerpo-gatos');
    cuerpoGatos.innerHTML = '';

    estadoGatos.forEach(gato => {
        let colorEstado = gato.estado === 'Disponible' ? 'green' : (gato.estado === 'Ocupado' ? 'red' : 'gray');
        
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><strong>${gato.nombre}</strong></td>
            <td>${gato.tipo}</td>
            <td>${gato.llego}</td>
            <td>${gato.horario}</td>
            <td style="color: ${colorEstado}; font-weight: bold;">${gato.estado}</td>
            <td>${gato.asignacion}</td>
        `;
        cuerpoGatos.appendChild(fila);
    });
}

function actualizarVistaPCs() {
    const contenedor = document.getElementById('contenedor-pcs');
    contenedor.innerHTML = '';

    estadoPCs.forEach(pc => {
        let colorFondo = pc.estado === 'Disponible' ? 'rgba(46, 204, 113, 0.2)' : (pc.estado === 'Ocupado' ? 'rgba(231, 76, 60, 0.2)' : 'rgba(241, 196, 15, 0.2)');
        let circulo = pc.estado === 'Disponible' ? '🟢' : (pc.estado === 'Ocupado' ? '🔴' : '🟡');
        let boton = '';

        if(pc.estado === "Ocupado"){
            const cliente = registroClientes.find(c => c.pc === pc.id && c.activo);
            const gato = cliente ? cliente.gato : '';
            // <-- Corrección: Se cambió gatoAsignado por gato
            boton = `<button class="btn-secundario" style="margin-top: 10px; padding: 6px 12px; border-radius: 5px; color: white; border: none; cursor: pointer; font-size: 13px;" onclick="terminarSesion('${pc.id}', '${gato}')">Terminar Sesión</button>`;
        }
        
        // <-- Corrección: Se agregó el botón a la estructura y se centró el contenido
        contenedor.innerHTML += `
            <div style="background: ${colorFondo}; padding: 15px 25px; border-radius: 8px; font-weight: bold; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <span>${circulo} ${pc.id}: ${pc.estado}</span>
                ${boton}
            </div>
        `;
    });
}

function actualizarTablaHistorial() {
    const cuerpoTabla = document.getElementById('cuerpo-historial');
    cuerpoTabla.innerHTML = '';

    registroClientes.forEach(cliente => {
        const fila = document.createElement('tr');
        const estadoTexto = cliente.activo ? '<span style="color: green; font-weight: bold;">Activo</span>' : '<span style="color: gray; font-weight: bold;">Finalizado</span>';
        fila.innerHTML = `
            <td>${cliente.nombre}</td>
            <td>${cliente.pc}</td>
            <td>${cliente.gato}</td>
            <td>${cliente.horas} hr(s)</td>
            <td>$${cliente.monto.toLocaleString()}</td>
            <td>${estadoTexto}</td>
        `;
        cuerpoTabla.appendChild(fila);
    });
}

function actualizarCierreCaja() {
    const totalClientes = registroClientes.length;
    const ingresosTotales = registroClientes.reduce((suma, cliente) => suma + cliente.monto, 0);
    document.getElementById('total-clientes').innerText = totalClientes;
    document.getElementById('total-ingresos').innerText = ingresosTotales.toLocaleString();
}

// ==========================================
// LIBERAR PC Y FINALIZAR SESIÓN
// ==========================================
function terminarSesion(pc, gato){
    const pcIndex = estadoPCs.findIndex(p => p.id === pc);
    const clienteIndex = registroClientes.findIndex(c => c.pc === pc && c.activo);

    if(clienteIndex !== -1){
        registroClientes[clienteIndex].activo = false; // <-- Corrección: false en lugar de falseM
    }
    
    if(pcIndex !== -1){
        estadoPCs[pcIndex].estado = 'Disponible';
    }

    if(gato && gato !== 'Sin acompañante'){
        const gatoIndex = estadoGatos.findIndex(g => g.nombre === gato);

        if(gatoIndex !== -1){
            estadoGatos[gatoIndex].estado = 'Disponible';
            estadoGatos[gatoIndex].asignacion = 'Ninguna';
        }
    }

    alert("Sesión terminada. PC y acompañante liberados.");
    actualizarVistaPCs();
    actualizarTablaGatos();
    cargarOpcionesGatos(); 
}

// ==========================================
// MENÚ DE PERFIL
// ==========================================
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
};

function cerrarSesion() { window.location.href = 'index.html'; }
function irConfiguraciones() { alert("Configuraciones del encargado..."); }