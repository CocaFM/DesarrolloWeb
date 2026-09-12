// ==========================================
// MEMORIA TEMPORAL
// ==========================================
let registroClientes = [];

// Base de datos de los gatos
let estadoGatos = [
    { id: 1, nombre: 'Luna', tipo: 'Siamesa', llego: 'Sí', horario: '09:00 - 15:00', estado: 'Disponible', asignacion: 'Ninguna' },
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

let estadoPCs = [
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

let intervaloTimerPCs = null; // Controla la actualización automática del reloj

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
    if (idSeccion === 'sec-agregar-cliente') {
        cargarOpcionesGatos();
        cargarOpcionesPCs(); // Filtra los PCs disponibles
    }
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
    
    if(intervaloTimerPCs) clearInterval(intervaloTimerPCs); // Pausa el reloj al salir de la vista de PCs
}

// ==========================================
// GESTIÓN DE CLIENTES, GATOS Y PCs
// ==========================================

function cargarOpcionesGatos() {
    const selectGato = document.getElementById('gato-cli');
    if (!selectGato) return;
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

function cargarOpcionesPCs() {
    const selectPC = document.getElementById('pc-cli');
    if (!selectPC) return;
    selectPC.innerHTML = '';
    
    let hayDisponibles = false;
    estadoPCs.forEach(pc => {
        if (pc.estado === 'Disponible') {
            const opcion = document.createElement('option');
            opcion.value = pc.id;
            opcion.textContent = pc.id;
            selectPC.appendChild(opcion);
            hayDisponibles = true;
        }
    });

    if (!hayDisponibles) {
        selectPC.innerHTML = '<option value="">Sin PCs disponibles</option>';
    }
}

function guardarClienteTemporal(evento) {
    evento.preventDefault();

    const nombre = document.getElementById('nombre-cli').value;
    const pcSelect = document.getElementById('pc-cli').value;
    const horas = parseInt(document.getElementById('horas-cli').value);
    const nombreGato = document.getElementById('gato-cli').value;
    const monto = parseFloat(document.getElementById('monto-cli').value) || 0;

    if (!pcSelect) {
        alert("No hay PCs disponibles para asignar.");
        return;
    }

    const ahora = Date.now(); 
    const horaRegistroStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Actualizar estado del gato si se seleccionó uno
    if (nombreGato !== "") {
        const gatoIndex = estadoGatos.findIndex(g => g.nombre === nombreGato);
        if (gatoIndex !== -1) {
            estadoGatos[gatoIndex].estado = 'Ocupado';
            estadoGatos[gatoIndex].asignacion = `Cliente: ${nombre} | ${pcSelect}`;
        }
    }

    // Actualizar estado del PC y guardar los datos de tiempo
    const pcIndex = estadoPCs.findIndex(p => p.id === pcSelect);
    if(pcIndex !== -1) {
        estadoPCs[pcIndex].estado = 'Ocupado';
        estadoPCs[pcIndex].cliente = nombre;
        estadoPCs[pcIndex].gato = nombreGato || 'Sin acompañante';
        estadoPCs[pcIndex].horaInicioMilisegundos = ahora;
        estadoPCs[pcIndex].horasAsignadas = horas;
        estadoPCs[pcIndex].horaInicioStr = horaRegistroStr;
    }

    registroClientes.push({
        nombre: nombre,
        pc: pcSelect,
        gato: nombreGato || 'Sin acompañante',
        horas: horas,
        monto: monto,
        activo: true 
    });

    alert(`Cliente registrado. PC asignado: ${pcSelect}.`);
    document.getElementById('form-cliente').reset();
    cargarOpcionesGatos(); 
    cargarOpcionesPCs(); 
}

function actualizarTablaGatos() {
    const cuerpoGatos = document.getElementById('cuerpo-gatos');
    if(!cuerpoGatos) return;
    cuerpoGatos.innerHTML = '';

    // Bloqueamos el diseño de la tabla para que no se deforme al cambiar palabras
    const tabla = cuerpoGatos.closest('table');
    if(tabla) {
        tabla.style.tableLayout = 'fixed';
    }

    estadoGatos.forEach(gato => {
        let colorEstado = gato.estado === 'Disponible' ? 'green' : (gato.estado === 'Ocupado' ? 'red' : 'gray');
        
        let colorBoton = gato.llego === 'Sí' ? '#2ecc71' : '#e74c3c';
        // Fijamos también el ancho del botón para evitar saltos
        let botonLlegada = `<button onclick="alternarLlegada(${gato.id})" style="background-color: ${colorBoton}; color: white; border: none; padding: 5px 0; width: 45px; border-radius: 5px; cursor: pointer; font-weight: bold; text-align: center;">${gato.llego}</button>`;
        
        const fila = document.createElement('tr');
        // Se aplican porcentajes estrictos a las columnas para congelar su estructura
        fila.innerHTML = `
            <td style="width: 15%;"><strong>${gato.nombre}</strong></td>
            <td style="width: 25%;">${gato.tipo}</td>
            <td style="width: 10%; text-align: center;">${botonLlegada}</td>
            <td style="width: 15%;">${gato.horario}</td>
            <td style="width: 15%; color: ${colorEstado}; font-weight: bold;">${gato.estado}</td>
            <td style="width: 20%;">${gato.asignacion}</td>
        `;
        cuerpoGatos.appendChild(fila);
    });
}

function alternarLlegada(idGato) {
    const gatoIndex = estadoGatos.findIndex(g => g.id === idGato);
    
    if (gatoIndex !== -1) {
        const gato = estadoGatos[gatoIndex];
        
        if (gato.estado === 'Ocupado') {
            alert(`No puedes marcar como ausente a ${gato.nombre} porque está actualmente asignado a un cliente.`);
            return;
        }

        if (gato.llego === 'Sí') {
            gato.llego = 'No';
            gato.estado = 'No disponible';
        } else {
            gato.llego = 'Sí';
            gato.estado = 'Disponible';
        }

        actualizarTablaGatos();
        cargarOpcionesGatos(); 
    }
}

function actualizarVistaPCs() {
    const contenedor = document.getElementById('contenedor-pcs');
    if(!contenedor) return;
    contenedor.innerHTML = '';

    // Transformamos el contenedor en una cuadrícula fija de exactamente 4 columnas
    contenedor.style.display = 'grid';
    contenedor.style.gridTemplateColumns = 'repeat(4, 1fr)';
    contenedor.style.gap = '20px';

    estadoPCs.forEach(pc => {
        let colorFondo = pc.estado === 'Disponible' ? 'rgba(46, 204, 113, 0.2)' : (pc.estado === 'Ocupado' ? 'rgba(231, 76, 60, 0.2)' : 'rgba(241, 196, 15, 0.2)');
        let circulo = pc.estado === 'Disponible' ? '🟢' : (pc.estado === 'Ocupado' ? '🔴' : '🟡');
        let infoExtra = '';
        let boton = '';

        if(pc.estado === "Ocupado"){
            const msPorHora = 3600000;
            const msPorMinuto = 60000;
            const horaFin = pc.horaInicioMilisegundos + (pc.horasAsignadas * msPorHora);
            const tiempoRestanteMs = horaFin - Date.now();
            
            let textoTiempo = '';
            if (tiempoRestanteMs <= 0) {
                textoTiempo = '<span style="color: #e74c3c; font-weight: bold;">¡Tiempo Agotado!</span>';
            } else {
                let horasRest = Math.floor(tiempoRestanteMs / msPorHora);
                let minsRest = Math.floor((tiempoRestanteMs % msPorHora) / msPorMinuto);
                textoTiempo = `${horasRest.toString().padStart(2, '0')}:${minsRest.toString().padStart(2, '0')}`;
            }

            infoExtra = `
                <div style="background: rgba(255,255,255,0.7); color: #333; font-size: 14px; text-align: left; padding: 10px; border-radius: 8px; margin-top: 10px; width: 100%; box-sizing: border-box; flex-grow: 1;">
                    <p style="margin: 3px 0;">👤 <b>Cliente:</b> ${pc.cliente}</p>
                    <p style="margin: 3px 0;">🐈 <b>Acompañante:</b> ${pc.gato}</p>
                    <p style="margin: 3px 0;">🕒 <b>Inicio:</b> ${pc.horaInicioStr}</p>
                    <p style="margin: 3px 0;">⏳ <b>Restante:</b> ${textoTiempo}</p>
                </div>
            `;
            boton = `<button class="btn-secundario" style="margin-top: 10px; padding: 8px 12px; border-radius: 5px; color: white; border: none; cursor: pointer; font-size: 13px; width: 100%;" onclick="terminarSesion('${pc.id}', '${pc.gato}')">Terminar Sesión</button>`;
        } else {
            // Relleno invisible para que los PCs disponibles tengan la misma altura que los ocupados
            infoExtra = `<div style="flex-grow: 1;"></div>`;
            boton = `<div style="height: 35px; margin-top: 10px;"></div>`;
        }
        
        contenedor.innerHTML += `
            <div style="background: ${colorFondo}; padding: 15px; border-radius: 8px; font-weight: bold; text-align: center; display: flex; flex-direction: column; min-height: 250px;">
                <span style="font-size: 16px;">${circulo} ${pc.id}: ${pc.estado}</span>
                ${infoExtra}
                ${boton}
            </div>
        `;
    });

    // Actualización automática del reloj cada 60 segundos
    if(intervaloTimerPCs) clearInterval(intervaloTimerPCs);
    intervaloTimerPCs = setInterval(() => {
        if(document.getElementById('sec-estados').classList.contains('activo')) {
            actualizarVistaPCs(); 
        }
    }, 60000);
}

function actualizarTablaHistorial() {
    const cuerpoTabla = document.getElementById('cuerpo-historial');
    if(!cuerpoTabla) return;
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
        registroClientes[clienteIndex].activo = false; 
    }
    
    if(pcIndex !== -1){
        estadoPCs[pcIndex].estado = 'Disponible';
        delete estadoPCs[pcIndex].cliente;
        delete estadoPCs[pcIndex].gato;
        delete estadoPCs[pcIndex].horaInicioMilisegundos;
        delete estadoPCs[pcIndex].horasAsignadas;
        delete estadoPCs[pcIndex].horaInicioStr;
    }

    if(gato && gato !== 'Sin acompañante'){
        const gatoIndex = estadoGatos.findIndex(g => g.nombre === gato);

        if(gatoIndex !== -1){
            estadoGatos[gatoIndex].estado = 'Disponible';
            estadoGatos[gatoIndex].asignacion = 'Ninguna';
        }
    }

    alert(`Sesión terminada. El ${pc} y el acompañante han sido liberados.`);
    
    actualizarVistaPCs();
    actualizarTablaGatos();
    cargarOpcionesGatos(); 
    cargarOpcionesPCs(); 
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