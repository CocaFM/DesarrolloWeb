// ==========================================================================
// 1. MEMORIA TEMPORAL Y BASES DE DATOS
// ==========================================================================
let registroClientes = [];

// Base de datos de los gatos
let estadoGatos = [
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

// Cargar desde LocalStorage para estar sincronizado con el Administrador
let estadoPCs = JSON.parse(localStorage.getItem('cybercate_pcs')) || [
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

// Función para guardar los cambios en uso (Ocupar/Desocupar)
function sincronizarPCsEncargado() {
    localStorage.setItem('cybercate_pcs', JSON.stringify(estadoPCs));
}

// Cargar precios dinámicos desde el Administrador (si no existen, usa valores por defecto)
function obtenerPreciosActuales() {
    return JSON.parse(localStorage.getItem('cybercate_precios')) || {
        horaBase: 2500,
        horaExtra: 1000,
        gatoBase: 0,
        gatoExtra: 1500,
        bebida: 1200,
        snack: 800
    };
}
const precios = obtenerPreciosActuales();

let intervaloTimerPCs = null; 

// ==========================================================================
// 2. NAVEGACIÓN ENTRE SUBPÁGINAS
// ==========================================================================

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

    // Cargas dinámicas
    if (idSeccion === 'sec-agregar-cliente') {
        cargarOpcionesGatos();
        cargarOpcionesPCs(); 
    }
    if (idSeccion === 'sec-estado-acompanantes') actualizarTablaGatos();
    if (idSeccion === 'sec-estados') actualizarVistaPCs();
    if (idSeccion === 'sec-historial') actualizarTablaHistorial();
    if (idSeccion === 'sec-cierre-caja') actualizarCierreCaja();
    if (idSeccion === 'sec-agregar-servicio') cargarOpcionesPCsActivos();
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
    
    if(intervaloTimerPCs) clearInterval(intervaloTimerPCs); 
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
};

function cerrarSesion() { window.location.href = 'index.html'; }
function irConfiguraciones() { alert("Configuraciones del encargado..."); }


// ==========================================================================
// 3. AGREGAR CLIENTE NUEVO (Y SU CÁLCULO DE TARIFA CON TAGS)
// ==========================================================================
const TARIFA_POR_HORA = precios.horaBase;
let serviciosSeleccionadosCli = [];

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

    if (!hayDisponibles) selectPC.innerHTML = '<option value="">Sin PCs disponibles</option>';
}

function actualizarMontoCli() {
    const horas = parseInt(document.getElementById('horas-cli').value) || 0;
    let total = horas * TARIFA_POR_HORA;
    
    // Sumar servicios adicionales seleccionados (Tags)
    serviciosSeleccionadosCli.forEach(s => total += s.precio);
    
    const inputMonto = document.getElementById('monto-cli');
    if(inputMonto) inputMonto.value = total;
}

const inputHorasCli = document.getElementById('horas-cli');
if (inputHorasCli) inputHorasCli.addEventListener('input', actualizarMontoCli);

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

    if (nombreGato !== "") {
        const gatoIndex = estadoGatos.findIndex(g => g.nombre === nombreGato);
        if (gatoIndex !== -1) {
            estadoGatos[gatoIndex].estado = 'Ocupado';
            estadoGatos[gatoIndex].asignacion = `Cliente: ${nombre} | ${pcSelect}`;
        }
    }

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
    
    // Reiniciar los Tags de Cliente
    serviciosSeleccionadosCli = [];
    actualizarTagsServiciosCli();
    
    cargarOpcionesGatos(); 
    cargarOpcionesPCs(); 
    sincronizarPCsEncargado();
}


// ==========================================================================
// 4. GESTIÓN DE ACOMPAÑANTES Y MODAL DE HORARIOS
// ==========================================================================

function actualizarTablaGatos() {
    const cuerpoGatos = document.getElementById('cuerpo-gatos');
    if(!cuerpoGatos) return;
    cuerpoGatos.innerHTML = '';

    const tabla = cuerpoGatos.closest('table');
    if(tabla) tabla.style.tableLayout = 'fixed';

    estadoGatos.forEach(gato => {
        let colorEstado = gato.estado === 'Disponible' ? 'green' : (gato.estado === 'Ocupado' ? 'red' : 'gray');
        let colorBoton = gato.llego === 'Sí' ? '#2ecc71' : '#e74c3c';
        
        let botonLlegada = `<button onclick="alternarLlegada(${gato.id})" style="background-color: ${colorBoton}; color: white; border: none; padding: 5px 0; width: 45px; border-radius: 5px; cursor: pointer; font-weight: bold; text-align: center; margin: 0 auto; display: block;">${gato.llego}</button>`;
        
        // Botón de lápiz sin márgenes extraños
        let btnHorario = `<button onclick="abrirModalHorario(${gato.id}, '${gato.horario}')" style="background: none; border: none; cursor: pointer; font-size: 16px; margin-left: 8px; padding: 0;" title="Modificar horario">✏️</button>`;

        const fila = document.createElement('tr');
        
        // Flexbox en el horario para forzar una línea
        fila.innerHTML = `
            <td style="width: 15%;"><strong>${gato.nombre}</strong></td>
            <td style="width: 25%;">${gato.tipo}</td>
            <td style="width: 10%;">${botonLlegada}</td>
            <td style="width: 15%;">
                <div style="display: flex; align-items: center; justify-content: center; white-space: nowrap;">
                    ${gato.horario} ${btnHorario}
                </div>
            </td>
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

// Lógica del Modal
function abrirModalHorario(idGato, horarioActual) {
    document.getElementById('modal-gato-id').value = idGato;
    let partes = horarioActual.split(' - ');
    if(partes.length === 2) {
        document.getElementById('modal-hora-entrada').value = partes[0].trim();
        document.getElementById('modal-hora-salida').value = partes[1].trim() === '00:00' ? '23:59' : partes[1].trim(); 
    }
    document.getElementById('modal-horario').classList.remove('oculto');
}

function cerrarModalHorario() {
    document.getElementById('modal-horario').classList.add('oculto');
}

function guardarHorario() {
    let id = parseInt(document.getElementById('modal-gato-id').value);
    let entrada = document.getElementById('modal-hora-entrada').value;
    let salida = document.getElementById('modal-hora-salida').value;
    
    if(!entrada || !salida) {
        alert("Por favor completa ambos horarios.");
        return;
    }
    
    if(salida === '23:59') salida = '00:00';

    let gatoIndex = estadoGatos.findIndex(g => g.id === id);
    if(gatoIndex !== -1) {
        estadoGatos[gatoIndex].horario = `${entrada} - ${salida}`;
        actualizarTablaGatos();
    }
    cerrarModalHorario();
}


// ==========================================================================
// 5. ESTADOS DEL PC (RELOJ Y MONITOREO)
// ==========================================================================

function actualizarVistaPCs() {
    // NUEVA LÍNEA: Actualiza la lista por si el Admin hizo cambios
    estadoPCs = JSON.parse(localStorage.getItem('cybercate_pcs')) || estadoPCs;

    const contenedor = document.getElementById('contenedor-pcs');
    if(!contenedor) return;
    contenedor.innerHTML = '';

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

    if(intervaloTimerPCs) clearInterval(intervaloTimerPCs);
    intervaloTimerPCs = setInterval(() => {
        if(document.getElementById('sec-estados').classList.contains('activo')) {
            actualizarVistaPCs(); 
        }
    }, 60000);
}


// ==========================================================================
// 6. HISTORIAL Y CIERRE DE CAJA (FINALIZAR SESIONES)
// ==========================================================================

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

function terminarSesion(pc, gato){
    const pcIndex = estadoPCs.findIndex(p => p.id === pc);
    const clienteIndex = registroClientes.findIndex(c => c.pc === pc && c.activo);

    if(clienteIndex !== -1) registroClientes[clienteIndex].activo = false; 
    
    if(pcIndex !== -1){
        estadoPCs[pcIndex].estado = 'Disponible';
        delete estadoPCs[pcIndex].cliente;
        delete estadoPCs[pcIndex].gato;
        delete estadoPCs[pcIndex].horaInicioMilisegundos;
        delete estadoPCs[pcIndex].horasAsignadas;
        delete estadoPCs[pcIndex].horaInicioStr;
    }

    // Liberar cualquier cantidad de gatos asignados
if(gato && gato !== 'Sin acompañante'){
    let gatosALiberar = gato.split(', ');
    gatosALiberar.forEach(g => {
        const gatoIndex = estadoGatos.findIndex(estado => estado.nombre === g);
        if(gatoIndex !== -1){
            estadoGatos[gatoIndex].estado = 'Disponible';
            estadoGatos[gatoIndex].asignacion = 'Ninguna';
        }
    });
}

    alert(`Sesión terminada. El ${pc} y el/los acompañante(s) han sido liberados.`);
    actualizarVistaPCs();
    actualizarTablaGatos();
    cargarOpcionesGatos(); 
    cargarOpcionesPCs(); 
    sincronizarPCsEncargado();
}


// ==========================================================================
// 7. MODIFICAR SESIÓN (SERVICIOS ADICIONALES Y GATOS EXTRA)
// ==========================================================================

const COSTO_GATO_EXTRA = precios.gatoExtra;
let serviciosSeleccionados = [];
let gatosExtraSeleccionados = [];

function cargarOpcionesPCsActivos() {
    const selectPCExtra = document.getElementById('pc-extra');
    if (!selectPCExtra) return;
    
    selectPCExtra.innerHTML = '';
    let hayActivos = false;
    
    estadoPCs.forEach(pc => {
        if (pc.estado === 'Ocupado') {
            const opcion = document.createElement('option');
            opcion.value = pc.id;
            opcion.textContent = `${pc.id} (Cliente: ${pc.cliente})`;
            selectPCExtra.appendChild(opcion);
            hayActivos = true;
        }
    });

    if (!hayActivos) selectPCExtra.innerHTML = '<option value="">No hay PCs ocupados actualmente</option>';

    cargarOpcionesCambioGato();
    serviciosSeleccionados = [];
    gatosExtraSeleccionados = [];
    actualizarSumaTotalExtra();
    actualizarTagsServicios();
    actualizarTagsGatos();
}

function cargarOpcionesCambioGato() {
    const selectPrincipal = document.getElementById('cambio-gato-extra');
    const selectExtra = document.getElementById('select-add-gato');
    if (!selectPrincipal) return;

    let baseHTML = '<option value="">Mantener actual / Sin cambios</option>';
    baseHTML += '<option value="QUITAR">Quitar acompañante actual</option>';
    let extraHTML = '<option value="" disabled selected hidden>+ Despliega aquí para elegir acompañantes extra...</option>';

    estadoGatos.forEach(gato => {
        if (gato.estado === 'Disponible') {
            const opcion = `<option value="${gato.nombre}">${gato.nombre} (${gato.tipo})</option>`;
            baseHTML += opcion;
            extraHTML += opcion;
        }
    });

    selectPrincipal.innerHTML = baseHTML;
    if(selectExtra) selectExtra.innerHTML = extraHTML;
}

function actualizarSumaTotalExtra() {
    let total = 0;
    serviciosSeleccionados.forEach(s => total += s.precio);
    total += (gatosExtraSeleccionados.length * COSTO_GATO_EXTRA);
    
    const inputMonto = document.getElementById('monto-extra');
    if(inputMonto) inputMonto.value = total;
}

// INICIALIZACIÓN DE LOS 3 MENÚS DE TAGS (NATIVOS)
document.addEventListener('DOMContentLoaded', () => {
    
    // A. Menú de Servicios (Modificar Sesión)
    const selectSrv = document.getElementById('select-add-servicio');
    if (selectSrv) {
        selectSrv.addEventListener('change', (e) => {
            if (e.target.value === "") return;
            const selectedOption = e.target.options[e.target.selectedIndex];
            serviciosSeleccionados.push({
                id: Date.now() + Math.random(), 
                nombre: selectedOption.value,
                precio: parseInt(selectedOption.getAttribute('data-precio')),
                horas: parseInt(selectedOption.getAttribute('data-horas'))
            });
            actualizarTagsServicios();
            e.target.value = ""; 
        });
    }

    // B. Menú de Gatos Extra (Modificar Sesión)
    const selectGato = document.getElementById('select-add-gato');
    if (selectGato) {
        selectGato.addEventListener('change', (e) => {
            if (e.target.value === "") return;
            if (gatosExtraSeleccionados.length >= 4) {
                alert("Límite alcanzado: Máximo 4 acompañantes extra permitidos.");
                e.target.value = "";
                return;
            }
            const nombreGato = e.target.value;
            if (gatosExtraSeleccionados.includes(nombreGato)) {
                alert("Este acompañante ya fue seleccionado.");
                e.target.value = "";
                return;
            }
            gatosExtraSeleccionados.push(nombreGato);
            actualizarTagsGatos();
            e.target.value = ""; 
        });
    }

    // C. Menú de Servicios (Agregar Cliente Nuevo)
    const selectSrvCli = document.getElementById('select-add-servicio-cli');
    if (selectSrvCli) {
        selectSrvCli.addEventListener('change', (e) => {
            if (e.target.value === "") return;
            const selectedOption = e.target.options[e.target.selectedIndex];
            serviciosSeleccionadosCli.push({
                id: Date.now() + Math.random(), 
                nombre: selectedOption.value,
                precio: parseInt(selectedOption.getAttribute('data-precio'))
            });
            actualizarTagsServiciosCli();
            e.target.value = ""; 
        });
    }
});

// Lógica Visual y de Eliminación de los 3 tipos de Tags
function actualizarTagsServicios() {
    const contenedor = document.getElementById('tags-servicios');
    if (!contenedor) return;
    contenedor.innerHTML = '';
    serviciosSeleccionados.forEach(servicio => {
        const tag = document.createElement('div');
        tag.className = 'tag-servicio';
        tag.innerHTML = `${servicio.nombre} <span class="tag-eliminar" onclick="eliminarServicio(${servicio.id})" title="Quitar servicio">&times;</span>`;
        contenedor.appendChild(tag);
    });
    actualizarSumaTotalExtra();
}
window.eliminarServicio = function(idAEliminar) {
    serviciosSeleccionados = serviciosSeleccionados.filter(s => s.id !== idAEliminar);
    actualizarTagsServicios();
};

function actualizarTagsGatos() {
    const contenedor = document.getElementById('tags-gatos');
    if (!contenedor) return;
    contenedor.innerHTML = '';
    gatosExtraSeleccionados.forEach(gato => {
        const tag = document.createElement('div');
        tag.className = 'tag-gato';
        tag.innerHTML = `${gato} <span class="tag-eliminar" onclick="eliminarGatoExtra('${gato}')" title="Quitar acompañante">&times;</span>`;
        contenedor.appendChild(tag);
    });
    actualizarSumaTotalExtra();
}
window.eliminarGatoExtra = function(nombreGato) {
    gatosExtraSeleccionados = gatosExtraSeleccionados.filter(g => g !== nombreGato);
    actualizarTagsGatos();
};

function actualizarTagsServiciosCli() {
    const contenedor = document.getElementById('tags-servicios-cli');
    if (!contenedor) return;
    contenedor.innerHTML = '';
    serviciosSeleccionadosCli.forEach(servicio => {
        const tag = document.createElement('div');
        tag.className = 'tag-servicio';
        tag.innerHTML = `${servicio.nombre} <span class="tag-eliminar" onclick="eliminarServicioCli(${servicio.id})" title="Quitar servicio">&times;</span>`;
        contenedor.appendChild(tag);
    });
    actualizarMontoCli(); 
}
window.eliminarServicioCli = function(idAEliminar) {
    serviciosSeleccionadosCli = serviciosSeleccionadosCli.filter(s => s.id !== idAEliminar);
    actualizarTagsServiciosCli();
};


function guardarExtra(evento) {
    evento.preventDefault();

    const pcSelect = document.getElementById('pc-extra').value;
    const montoExtra = parseInt(document.getElementById('monto-extra').value) || 0;
    const nuevoGatoPrincipal = document.getElementById('cambio-gato-extra').value;
    
    let horasExtraTotales = 0;
    serviciosSeleccionados.forEach(s => horasExtraTotales += s.horas);

    if (!pcSelect) { alert("Selecciona un PC."); return; }
    const pcIndex = estadoPCs.findIndex(p => p.id === pcSelect);
    const clienteIndex = registroClientes.findIndex(c => c.pc === pcSelect && c.activo === true);
    if (pcIndex === -1 || clienteIndex === -1) { alert("No se encontró la sesión."); return; }

    // Cobros y Horas
    if (montoExtra > 0) registroClientes[clienteIndex].monto += montoExtra;
    if (horasExtraTotales > 0) {
        estadoPCs[pcIndex].horasAsignadas += horasExtraTotales;
        registroClientes[clienteIndex].horas += horasExtraTotales;
    }

    // Cambio de gato principal
    let acompañantesNuevos = estadoPCs[pcIndex].gato === 'Sin acompañante' ? [] : estadoPCs[pcIndex].gato.split(', ');

    if (nuevoGatoPrincipal !== "") {
        const gatoActual = acompañantesNuevos[0]; 
        
        if (gatoActual && gatoActual !== '') {
            const idxActual = estadoGatos.findIndex(g => g.nombre === gatoActual);
            if (idxActual !== -1) {
                estadoGatos[idxActual].estado = 'Disponible';
                estadoGatos[idxActual].asignacion = 'Ninguna';
            }
            acompañantesNuevos.shift(); 
        }

        if (nuevoGatoPrincipal !== 'QUITAR') {
            const idxNuevo = estadoGatos.findIndex(g => g.nombre === nuevoGatoPrincipal);
            if (idxNuevo !== -1) {
                estadoGatos[idxNuevo].estado = 'Ocupado';
                estadoGatos[idxNuevo].asignacion = `Cliente: ${estadoPCs[pcIndex].cliente} | ${pcSelect}`;
                acompañantesNuevos.unshift(nuevoGatoPrincipal); 
            }
        }
    }

    // Gatos Extra
    gatosExtraSeleccionados.forEach(nombreGato => {
        const idx = estadoGatos.findIndex(g => g.nombre === nombreGato);
        if (idx !== -1) {
            estadoGatos[idx].estado = 'Ocupado';
            estadoGatos[idx].asignacion = `Cliente Extra: ${estadoPCs[pcIndex].cliente} | ${pcSelect}`;
            acompañantesNuevos.push(nombreGato);
        }
    });

    let stringAcompanantes = acompañantesNuevos.length > 0 ? acompañantesNuevos.join(', ') : 'Sin acompañante';
    estadoPCs[pcIndex].gato = stringAcompanantes;
    registroClientes[clienteIndex].gato = stringAcompanantes;

    if (montoExtra === 0 && nuevoGatoPrincipal === "" && gatosExtraSeleccionados.length === 0) {
         alert("No has seleccionado modificaciones.");
         return;
    }

    alert(`Se han aplicado las modificaciones al ${pcSelect}.`);
    
    document.getElementById('form-extras').reset();
    cargarOpcionesPCsActivos();
    actualizarVistaPCs();
    actualizarTablaGatos();
    cargarOpcionesGatos(); 
}


// ==========================================================================
// 8. AGENDA Y RESERVAS 
// ==========================================================================

let agendaReservas = [];
let contadorReservas = 1;

document.getElementById('horas-reserva').addEventListener('input', function() {
    const horas = parseInt(this.value) || 0;
    const inputMontoReserva = document.getElementById('monto-reserva');
    if(inputMontoReserva) inputMontoReserva.value = horas * TARIFA_POR_HORA;
});

function guardarReserva(evento) {
    evento.preventDefault();
    const nombre = document.getElementById('nombre-reserva').value;
    const fecha = document.getElementById('fecha-reserva').value;
    const horas = parseInt(document.getElementById('horas-reserva').value);
    const monto = horas * TARIFA_POR_HORA; 

    agendaReservas.push({
        id: contadorReservas++,
        nombre: nombre,
        fecha: fecha,
        horas: horas,
        monto: monto,
        estado: 'Pendiente'
    });

    alert(`Reserva de ${nombre} agendada correctamente.`);
    document.getElementById('form-reserva').reset();
    actualizarTablaReservas();
}

function actualizarTablaReservas() {
    const cuerpo = document.getElementById('cuerpo-reservas');
    if(!cuerpo) return;
    cuerpo.innerHTML = '';

    let opcionesPCsDisponibles = '<option value="">Seleccione PC...</option>';
    estadoPCs.forEach(pc => {
        if (pc.estado === 'Disponible') opcionesPCsDisponibles += `<option value="${pc.id}">${pc.id}</option>`;
    });

    let opcionesGatosDisponibles = '<option value="">Ninguno</option>';
    estadoGatos.forEach(gato => {
        if (gato.estado === 'Disponible') opcionesGatosDisponibles += `<option value="${gato.nombre}">${gato.nombre} (${gato.tipo})</option>`;
    });

    agendaReservas.forEach(reserva => {
        if(reserva.estado !== 'Pendiente') return;

        const fechaFormat = new Date(reserva.fecha).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
        const fila = document.createElement('tr');
        
        fila.innerHTML = `
            <td><strong>${reserva.nombre}</strong></td>
            <td>${fechaFormat}</td>
            <td>${reserva.horas} hr(s)</td>
            <td>$${reserva.monto.toLocaleString()}</td>
            <td>
                <select id="pc-llegada-${reserva.id}" style="width: 100%; padding: 8px; border-radius: 5px;">
                    ${opcionesPCsDisponibles}
                </select>
            </td>
            <td>
                <select id="gato-llegada-${reserva.id}" style="width: 100%; padding: 8px; border-radius: 5px;">
                    ${opcionesGatosDisponibles}
                </select>
            </td>
            <td style="display: flex; gap: 5px;">
                <button onclick="activarReserva(${reserva.id})" style="background-color: #2ecc71; padding: 8px; border: none; border-radius: 5px; color: white; cursor: pointer; font-weight: bold; flex: 1;">Iniciar</button>
                <button onclick="cancelarReserva(${reserva.id})" style="background-color: #e74c3c; padding: 8px; border: none; border-radius: 5px; color: white; cursor: pointer; font-weight: bold; flex: 1;">Cancelar</button>
            </td>
        `;
        cuerpo.appendChild(fila);
    });
}

function cancelarReserva(id) {
    const reservaIndex = agendaReservas.findIndex(r => r.id === id);
    if(reservaIndex === -1) return;
    const reserva = agendaReservas[reservaIndex];

    if (confirm(`¿Estás seguro de que deseas cancelar la reserva de ${reserva.nombre}?`)) {
        agendaReservas[reservaIndex].estado = 'Cancelada';
        actualizarTablaReservas();
        alert(`La reserva de ${reserva.nombre} ha sido cancelada.`);
    }
}

function activarReserva(id) {
    const reservaIndex = agendaReservas.findIndex(r => r.id === id);
    if(reservaIndex === -1) return;
    const reserva = agendaReservas[reservaIndex];
    
    const selectPC = document.getElementById(`pc-llegada-${reserva.id}`);
    const pcSeleccionado = selectPC.value;
    const selectGato = document.getElementById(`gato-llegada-${reserva.id}`);
    const gatoSeleccionado = selectGato.value;

    if (!pcSeleccionado) { alert("Por favor, asigne un PC disponible antes de iniciar la sesión."); return; }
    const pcIndex = estadoPCs.findIndex(p => p.id === pcSeleccionado);

    if (pcIndex !== -1) {
        if (estadoPCs[pcIndex].estado !== 'Disponible') { alert(`El ${pcSeleccionado} ya fue ocupado. Seleccione otro.`); return; }
        if (gatoSeleccionado !== "") {
            const indexGatoVerificar = estadoGatos.findIndex(g => g.nombre === gatoSeleccionado);
            if (indexGatoVerificar !== -1 && estadoGatos[indexGatoVerificar].estado !== 'Disponible') {
                alert(`El acompañante ${gatoSeleccionado} ya no está disponible. Seleccione otro.`);
                return;
            }
        }

        if(confirm(`¿Deseas iniciar la sesión de ${reserva.nombre} en el ${pcSeleccionado} por ${reserva.horas} hora(s)?`)) {
            const ahora = Date.now();
            const horaRegistroStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            let nombreAcompanante = 'Sin acompañante';
            if (gatoSeleccionado !== "") {
                const gatoIndex = estadoGatos.findIndex(g => g.nombre === gatoSeleccionado);
                if (gatoIndex !== -1) {
                    estadoGatos[gatoIndex].estado = 'Ocupado';
                    estadoGatos[gatoIndex].asignacion = `Cliente: ${reserva.nombre} | ${pcSeleccionado}`;
                    nombreAcompanante = gatoSeleccionado;
                }
            }

            estadoPCs[pcIndex].estado = 'Ocupado';
            estadoPCs[pcIndex].cliente = reserva.nombre;
            estadoPCs[pcIndex].gato = nombreAcompanante; 
            estadoPCs[pcIndex].horaInicioMilisegundos = ahora;
            estadoPCs[pcIndex].horasAsignadas = reserva.horas;
            estadoPCs[pcIndex].horaInicioStr = horaRegistroStr;

            registroClientes.push({
                nombre: reserva.nombre,
                pc: pcSeleccionado,
                gato: nombreAcompanante,
                horas: reserva.horas,
                monto: reserva.monto,
                activo: true
            });

            agendaReservas[reservaIndex].estado = 'Completada';
            actualizarTablaReservas();
            alert(`Sesión iniciada con éxito. El ${pcSeleccionado} y ${nombreAcompanante} han sido asignados.`);
        }
    }
}