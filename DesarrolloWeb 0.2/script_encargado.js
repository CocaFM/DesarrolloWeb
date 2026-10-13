// ==========================================================================
// 1. MEMORIA Y SINCRONIZACIÓN
// ==========================================================================
let registroClientes = JSON.parse(localStorage.getItem('cybercate_registro_clientes')) || [];
function sincronizarRegistroClientes() { localStorage.setItem('cybercate_registro_clientes', JSON.stringify(registroClientes)); }

let estadoGatos = JSON.parse(localStorage.getItem('cybercate_gatos')) || [];
function sincronizarGatosEncargado() { localStorage.setItem('cybercate_gatos', JSON.stringify(estadoGatos)); }

let estadoPCs = JSON.parse(localStorage.getItem('cybercate_pcs')) || [];
function sincronizarPCsEncargado() { localStorage.setItem('cybercate_pcs', JSON.stringify(estadoPCs)); }

function obtenerPreciosActuales() {
    return JSON.parse(localStorage.getItem('cybercate_precios')) || { horaBase: 2500, horaExtra: 1000, gatoBase: 0, gatoExtra: 1500, bebida: 1200, snack: 800, imprimir: 150 };
}
const precios = obtenerPreciosActuales();
let intervaloTimerPCs = null; 

// ==========================================================================
// 2. NAVEGACIÓN ENTRE SUBPÁGINAS
// ==========================================================================
function abrirSeccion(idSeccion, nombreSeccion) {
    document.getElementById('menu-principal-encargado').classList.remove('activo');
    document.getElementById('menu-principal-encargado').classList.add('oculto');
    document.querySelectorAll('.seccion-funcional').forEach(sec => { sec.classList.remove('activo'); sec.classList.add('oculto'); });

    const seccionActiva = document.getElementById(idSeccion);
    if (seccionActiva) { seccionActiva.classList.remove('oculto'); seccionActiva.classList.add('activo'); }

    document.getElementById('texto-ruta').innerText = ` : ${nombreSeccion}`;
    document.getElementById('btn-volver').classList.remove('oculto');

    if (idSeccion === 'sec-agregar-cliente') { cargarOpcionesGatos(); cargarOpcionesPCs(); }
    if (idSeccion === 'sec-estado-acompanantes') actualizarTablaGatos();
    if (idSeccion === 'sec-estados') actualizarVistaPCs();
    if (idSeccion === 'sec-historial') actualizarTablaHistorial();
    if (idSeccion === 'sec-cierre-caja') actualizarCierreCaja();
    if (idSeccion === 'sec-agregar-servicio') cargarOpcionesPCsActivos();
    if (idSeccion === 'sec-consultar-registro') actualizarTablaReservas();
}

function volverAlMenu() {
    document.querySelectorAll('.seccion-funcional').forEach(sec => { sec.classList.remove('activo'); sec.classList.add('oculto'); });
    document.getElementById('menu-principal-encargado').classList.remove('oculto');
    document.getElementById('menu-principal-encargado').classList.add('activo');
    document.getElementById('texto-ruta').innerText = '';
    document.getElementById('btn-volver').classList.add('oculto');
    if(intervaloTimerPCs) clearInterval(intervaloTimerPCs); 
}

function toggleMenuPerfil() { document.getElementById('menu-perfil')?.classList.toggle('activo'); }
window.onclick = function(evento) { if (!evento.target.matches('.btn-perfil')) { document.querySelectorAll('.menu-desplegable').forEach(m => m.classList.remove('activo')); } };
function cerrarSesion() { window.location.href = 'index.html'; }

// ==========================================================================
// 3. REGISTRAR CLIENTE NUEVO (CAJA)
// ==========================================================================
const TARIFA_POR_HORA = precios.horaBase;
let serviciosSeleccionadosCli = [];

function cargarOpcionesGatos() {
    const selectGato = document.getElementById('gato-cli');
    if (!selectGato) return;
    selectGato.innerHTML = '<option value="">Ninguno</option>';
    estadoGatos.forEach(gato => {
        if (gato.estado === 'Disponible') { selectGato.appendChild(new Option(`${gato.nombre} (${gato.tipo})`, gato.nombre)); }
    });
}

function cargarOpcionesPCs() {
    const selectPC = document.getElementById('pc-cli');
    if (!selectPC) return;
    selectPC.innerHTML = '';
    let hayDisponibles = false;
    estadoPCs.forEach(pc => {
        if (pc.estado === 'Disponible') { selectPC.appendChild(new Option(pc.id, pc.id)); hayDisponibles = true; }
    });
    if (!hayDisponibles) selectPC.innerHTML = '<option value="">Sin PCs disponibles</option>';
}

function actualizarMontoCli() {
    const horas = parseInt(document.getElementById('horas-cli').value) || 0;
    let total = horas * TARIFA_POR_HORA;
    if (document.getElementById('gato-cli').value !== "") total += precios.gatoBase;
    serviciosSeleccionadosCli.forEach(s => total += s.precio);
    if(document.getElementById('monto-cli')) document.getElementById('monto-cli').value = total;
}

document.getElementById('horas-cli')?.addEventListener('input', actualizarMontoCli);
document.getElementById('gato-cli')?.addEventListener('change', actualizarMontoCli);

function guardarClienteTemporal(evento) {
    evento.preventDefault();
    const nombre = document.getElementById('nombre-cli').value;
    const pcSelect = document.getElementById('pc-cli').value;
    const horas = parseInt(document.getElementById('horas-cli').value);
    const nombreGato = document.getElementById('gato-cli').value;
    const monto = parseFloat(document.getElementById('monto-cli').value) || 0;

    if (!pcSelect) { alert("No hay PCs disponibles para asignar."); return; }
    
    if (nombreGato !== "") {
        const gatoIndex = estadoGatos.findIndex(g => g.nombre === nombreGato);
        if (gatoIndex !== -1) { estadoGatos[gatoIndex].estado = 'Ocupado'; estadoGatos[gatoIndex].asignacion = `Cliente: ${nombre} | ${pcSelect}`; }
    }

    const pcIndex = estadoPCs.findIndex(p => p.id === pcSelect);
    if(pcIndex !== -1) {
        estadoPCs[pcIndex].estado = 'Ocupado';
        estadoPCs[pcIndex].cliente = nombre;
        estadoPCs[pcIndex].gato = nombreGato || 'Sin acompañante';
        estadoPCs[pcIndex].horaInicioMilisegundos = Date.now();
        estadoPCs[pcIndex].horasAsignadas = horas;
        estadoPCs[pcIndex].horaInicioStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    registroClientes.push({ nombre, pc: pcSelect, gato: nombreGato || 'Sin acompañante', horas, monto, activo: true });

    sincronizarRegistroClientes(); sincronizarPCsEncargado(); sincronizarGatosEncargado();
    alert(`Cliente registrado. PC asignado: ${pcSelect}.`);
    document.getElementById('form-cliente').reset();
    serviciosSeleccionadosCli = []; actualizarTagsServiciosCli();
    cargarOpcionesGatos(); cargarOpcionesPCs(); 
}

// ==========================================================================
// 4. TABLA DE GATOS Y MODAL DE HORARIOS
// ==========================================================================

// NUEVO: SISTEMA DE AUTO-LIMPIEZA DE GATOS FANTASMA
function limpiarGatosFantasma() {
    let modificados = false;
    estadoGatos.forEach(gato => {
        if (gato.estado === 'Ocupado') {
            // Revisa si el gato existe en algún PC que esté actualmente ocupado
            let estaEnUso = estadoPCs.some(pc => {
                if (pc.estado !== 'Ocupado' || !pc.gato) return false;
                let gatosDelPC = pc.gato.split(', ');
                return gatosDelPC.includes(gato.nombre);
            });
            // Si nadie lo está usando, lo libera forzosamente
            if (!estaEnUso) {
                gato.estado = 'Disponible';
                gato.asignacion = 'Ninguna';
                modificados = true;
            }
        }
    });
    if (modificados) sincronizarGatosEncargado();
}

function actualizarTablaGatos() {
    limpiarGatosFantasma(); // Limpia los datos corruptos apenas abres la pestaña

    const cuerpoGatos = document.getElementById('cuerpo-gatos');
    if(!cuerpoGatos) return;
    cuerpoGatos.innerHTML = '';
    
    estadoGatos.forEach(gato => {
        let colorEstado = gato.estado === 'Disponible' ? 'green' : (gato.estado === 'Ocupado' ? 'red' : 'gray');
        let colorBoton = gato.llego === 'Sí' ? '#2ecc71' : '#e74c3c';
        
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td style="width: 15%;"><strong>${gato.nombre}</strong></td><td style="width: 25%;">${gato.tipo}</td>
            <td style="width: 10%;"><button onclick="alternarLlegada(${gato.id})" style="background-color: ${colorBoton}; color: white; border: none; padding: 5px; width: 45px; border-radius: 5px;">${gato.llego}</button></td>
            <td style="width: 15%;">${gato.horario} <button onclick="abrirModalHorario(${gato.id}, '${gato.horario}')" style="background:none;border:none;">✏️</button></td>
            <td style="width: 15%; color: ${colorEstado}; font-weight: bold;">${gato.estado}</td><td style="width: 20%;">${gato.asignacion}</td>
        `;
        cuerpoGatos.appendChild(fila);
    });
}

function alternarLlegada(idGato) {
    const gatoIndex = estadoGatos.findIndex(g => g.id === idGato);
    if (gatoIndex !== -1) {
        if (estadoGatos[gatoIndex].estado === 'Ocupado') { alert(`No puedes marcar como ausente a alguien en uso.`); return; }
        estadoGatos[gatoIndex].llego = estadoGatos[gatoIndex].llego === 'Sí' ? 'No' : 'Sí';
        estadoGatos[gatoIndex].estado = estadoGatos[gatoIndex].llego === 'Sí' ? 'Disponible' : 'No disponible';
        sincronizarGatosEncargado(); actualizarTablaGatos(); cargarOpcionesGatos(); 
    }
}

function abrirModalHorario(id, horario) {
    document.getElementById('modal-gato-id').value = id;
    let partes = horario.split(' - ');
    if(partes.length === 2) {
        document.getElementById('modal-hora-entrada').value = partes[0].trim();
        document.getElementById('modal-hora-salida').value = partes[1].trim() === '00:00' ? '23:59' : partes[1].trim(); 
    }
    document.getElementById('modal-horario').classList.remove('oculto');
}
function cerrarModalHorario() { document.getElementById('modal-horario').classList.add('oculto'); }
function guardarHorario() {
    let id = parseInt(document.getElementById('modal-gato-id').value);
    let entrada = document.getElementById('modal-hora-entrada').value;
    let salida = document.getElementById('modal-hora-salida').value;
    if(!entrada || !salida) return;
    if(salida === '23:59') salida = '00:00';
    let idx = estadoGatos.findIndex(g => g.id === id);
    if(idx !== -1) { estadoGatos[idx].horario = `${entrada} - ${salida}`; sincronizarGatosEncargado(); actualizarTablaGatos(); }
    cerrarModalHorario();
}

// ==========================================================================
// 5. MONITOREO DE PCs Y TIMER
// ==========================================================================
function actualizarVistaPCs() {
    estadoPCs = JSON.parse(localStorage.getItem('cybercate_pcs')) || estadoPCs;
    const contenedor = document.getElementById('contenedor-pcs');
    if(!contenedor) return;
    contenedor.innerHTML = '';
    contenedor.style.display = 'grid'; contenedor.style.gridTemplateColumns = 'repeat(4, 1fr)'; contenedor.style.gap = '20px';

    estadoPCs.forEach(pc => {
        let colorFondo = pc.estado === 'Disponible' ? 'rgba(46, 204, 113, 0.2)' : (pc.estado === 'Ocupado' ? 'rgba(231, 76, 60, 0.2)' : 'rgba(241, 196, 15, 0.2)');
        let circulo = pc.estado === 'Disponible' ? '🟢' : (pc.estado === 'Ocupado' ? '🔴' : '🟡');
        let infoExtra = '', boton = '';

        if(pc.estado === "Ocupado"){
            const msPorHora = 3600000; const msPorMinuto = 60000;
            const horaFin = pc.horaInicioMilisegundos + (pc.horasAsignadas * msPorHora);
            const tiempoRestanteMs = horaFin - Date.now();
            let textoTiempo = tiempoRestanteMs <= 0 ? '<span style="color:#e74c3c;">¡Tiempo Agotado!</span>' : `${Math.floor(tiempoRestanteMs/msPorHora).toString().padStart(2,'0')}:${Math.floor((tiempoRestanteMs%msPorHora)/msPorMinuto).toString().padStart(2,'0')}`;
            
            infoExtra = `<div style="background: rgba(255,255,255,0.7); color: #333; font-size: 14px; text-align: left; padding: 10px; border-radius: 8px; margin-top: 10px; flex-grow: 1;">
                <p>👤 <b>Cliente:</b> ${pc.cliente}</p><p>🐈 <b>Gato:</b> ${pc.gato}</p><p>🕒 <b>Inicio:</b> ${pc.horaInicioStr}</p><p>⏳ <b>Restante:</b> ${textoTiempo}</p></div>`;
            boton = `<button class="btn-secundario" style="margin-top: 10px; width: 100%;" onclick="terminarSesion('${pc.id}', '${pc.gato}')">Terminar Sesión</button>`;
        } else { infoExtra = `<div style="flex-grow: 1;"></div>`; boton = `<div style="height: 35px; margin-top: 10px;"></div>`; }
        
        contenedor.innerHTML += `<div style="background: ${colorFondo}; padding: 15px; border-radius: 8px; font-weight: bold; text-align: center; display: flex; flex-direction: column; min-height: 250px;"><span style="font-size: 16px;">${circulo} ${pc.id}: ${pc.estado}</span>${infoExtra}${boton}</div>`;
    });
    if(intervaloTimerPCs) clearInterval(intervaloTimerPCs);
    intervaloTimerPCs = setInterval(() => { if(document.getElementById('sec-estados').classList.contains('activo')) actualizarVistaPCs(); }, 60000);
}

// ==========================================================================
// 6. HISTORIAL Y CIERRE DE CAJA
// ==========================================================================
function actualizarTablaHistorial() {
    const cuerpoTabla = document.getElementById('cuerpo-historial');
    if(!cuerpoTabla) return;
    cuerpoTabla.innerHTML = '';
    registroClientes.forEach(cli => {
        const fila = document.createElement('tr');
        fila.innerHTML = `<td>${cli.nombre}</td><td>${cli.pc}</td><td>${cli.gato}</td><td>${cli.horas} hr(s)</td><td>$${cli.monto.toLocaleString()}</td><td>${cli.activo ? '<span style="color:green;">Activo</span>' : '<span style="color:gray;">Finalizado</span>'}</td>`;
        cuerpoTabla.appendChild(fila);
    });
}

function actualizarCierreCaja() {
    document.getElementById('total-clientes').innerText = registroClientes.length;
    document.getElementById('total-ingresos').innerText = registroClientes.reduce((suma, c) => suma + c.monto, 0).toLocaleString();
}

function terminarSesion(pc, gato){
    const pcIndex = estadoPCs.findIndex(p => p.id === pc);
    const cliIndex = registroClientes.findIndex(c => c.pc === pc && c.activo);
    if(cliIndex !== -1) registroClientes[cliIndex].activo = false; 
    
    if(pcIndex !== -1){
        estadoPCs[pcIndex].estado = 'Disponible';
        delete estadoPCs[pcIndex].cliente; delete estadoPCs[pcIndex].gato; delete estadoPCs[pcIndex].horaInicioMilisegundos; delete estadoPCs[pcIndex].horasAsignadas; delete estadoPCs[pcIndex].horaInicioStr;
    }
    if(gato && gato !== 'Sin acompañante'){
        gato.split(', ').forEach(g => {
            let idx = estadoGatos.findIndex(estado => estado.nombre === g);
            if(idx !== -1) { estadoGatos[idx].estado = 'Disponible'; estadoGatos[idx].asignacion = 'Ninguna'; }
        });
    }
    sincronizarRegistroClientes(); sincronizarPCsEncargado(); sincronizarGatosEncargado();
    alert(`Sesión terminada. PC y acompañantes liberados.`);
    actualizarVistaPCs(); actualizarTablaGatos(); actualizarTablaHistorial(); cargarOpcionesGatos(); cargarOpcionesPCs(); 
}

function finalizarCierreCaja() {
    // NUEVO: BLOQUEO DE SEGURIDAD. Verifica si hay PCs activos antes de dejarte cerrar caja.
    let pcsOcupados = estadoPCs.filter(pc => pc.estado === 'Ocupado');
    if (pcsOcupados.length > 0) {
        alert("⚠️ ¡Acción denegada! Hay sesiones de PC activas en este momento. Debes terminar todas las sesiones antes de poder cerrar la caja.");
        return;
    }

    const totalCli = registroClientes.length;
    const ingresos = registroClientes.reduce((suma, c) => suma + c.monto, 0);
    if (totalCli === 0) { alert("No hay registros de clientes en este turno para realizar el cierre de caja."); return; }
    
    if (confirm(`¿Confirmas el cierre de caja por un total de $${ingresos.toLocaleString()} con ${totalCli} clientes atendidos?`)) {
        let correoActivo = localStorage.getItem('cybercate_usuario_activo') || 'encargado@mail.com';
        let historialCierres = JSON.parse(localStorage.getItem('cybercate_cierres')) || [];
        historialCierres.push({ fecha: new Date().toLocaleString(), correo: correoActivo, clientes: totalCli, total: ingresos });
        localStorage.setItem('cybercate_cierres', JSON.stringify(historialCierres));
        
        registroClientes = []; 
        sincronizarRegistroClientes(); 
        actualizarTablaHistorial(); 
        actualizarCierreCaja();
        alert("Caja cerrada exitosamente. El reporte ha sido enviado al Administrador."); 
        volverAlMenu();
    }
}

// ==========================================================================
// 7. MODIFICAR SESIÓN (SERVICIOS Y GATOS EXTRA)
// ==========================================================================
let serviciosSeleccionados = []; let gatosExtraSeleccionados = [];

function cargarOpcionesPCsActivos() {
    const selectPCExtra = document.getElementById('pc-extra');
    if (!selectPCExtra) return;
    selectPCExtra.innerHTML = '';
    let hayActivos = false;
    estadoPCs.forEach(pc => {
        if (pc.estado === 'Ocupado') { selectPCExtra.appendChild(new Option(`${pc.id} (Cliente: ${pc.cliente})`, pc.id)); hayActivos = true; }
    });
    if (!hayActivos) selectPCExtra.innerHTML = '<option value="">No hay PCs ocupados</option>';
    cargarOpcionesCambioGato();
    serviciosSeleccionados = []; gatosExtraSeleccionados = [];
    actualizarSumaTotalExtra(); actualizarTagsServicios(); actualizarTagsGatos();
}

function cargarOpcionesCambioGato() {
    const selectPrincipal = document.getElementById('cambio-gato-extra');
    const selectExtra = document.getElementById('select-add-gato');
    if (!selectPrincipal) return;
    let baseHTML = '<option value="">Mantener actual</option><option value="QUITAR">Quitar acompañante</option>';
    let extraHTML = '<option value="" disabled selected hidden>+ Elegir acompañantes extra...</option>';
    estadoGatos.forEach(gato => {
        if (gato.estado === 'Disponible') {
            let opt = `<option value="${gato.nombre}">${gato.nombre} (${gato.tipo})</option>`;
            baseHTML += opt; extraHTML += opt;
        }
    });
    selectPrincipal.innerHTML = baseHTML; if(selectExtra) selectExtra.innerHTML = extraHTML;
}

function actualizarSumaTotalExtra() {
    let total = 0;
    serviciosSeleccionados.forEach(s => total += s.precio);
    total += (gatosExtraSeleccionados.length * precios.gatoExtra);
    if(document.getElementById('monto-extra')) document.getElementById('monto-extra').value = total;
}

function actualizarTextosPreciosUI() {
    document.querySelectorAll('#select-add-servicio-cli option, #select-add-servicio option').forEach(opt => {
        if (opt.value.includes("Hora Extra")) opt.text = `Hora Extra ($${precios.horaExtra})`;
        else if (opt.value.includes("Bebida")) opt.text = `Bebida ($${precios.bebida})`;
        else if (opt.value.includes("Snack")) opt.text = `Snack ($${precios.snack})`;
        else if (opt.value.includes("Impresión")) opt.text = `Impresión ($${precios.imprimir})`;
    });
    document.querySelectorAll('label').forEach(lbl => {
        if (lbl.innerText.includes('Agregar Acompañantes Extra')) lbl.innerText = `Agregar Acompañantes Extra (Máx. 4, +$${precios.gatoExtra} c/u):`;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    actualizarTextosPreciosUI();
    document.getElementById('select-add-servicio')?.addEventListener('change', (e) => {
        if (e.target.value === "") return;
        let precioAsignado = e.target.value.includes("Hora") ? precios.horaExtra : (e.target.value.includes("Bebida") ? precios.bebida : (e.target.value.includes("Snack") ? precios.snack : precios.imprimir));
        serviciosSeleccionados.push({ id: Date.now(), nombre: e.target.value, precio: precioAsignado, horas: parseInt(e.target.options[e.target.selectedIndex].getAttribute('data-horas')) || 0 });
        actualizarTagsServicios(); e.target.value = ""; 
    });

    document.getElementById('select-add-gato')?.addEventListener('change', (e) => {
        if (e.target.value === "") return;
        if (gatosExtraSeleccionados.length >= 4) { alert("Límite alcanzado."); e.target.value = ""; return; }
        if (gatosExtraSeleccionados.includes(e.target.value)) { alert("Ya seleccionado."); e.target.value = ""; return; }
        gatosExtraSeleccionados.push(e.target.value); actualizarTagsGatos(); e.target.value = ""; 
    });

    document.getElementById('select-add-servicio-cli')?.addEventListener('change', (e) => {
        if (e.target.value === "") return;
        let precioAsignado = e.target.value.includes("Hora") ? precios.horaExtra : (e.target.value.includes("Bebida") ? precios.bebida : (e.target.value.includes("Snack") ? precios.snack : precios.imprimir));
        serviciosSeleccionadosCli.push({ id: Date.now(), nombre: e.target.value, precio: precioAsignado });
        actualizarTagsServiciosCli(); e.target.value = ""; 
    });
});

function actualizarTagsServicios() {
    document.getElementById('tags-servicios').innerHTML = serviciosSeleccionados.map(s => `<div class="tag-servicio">${s.nombre} <span class="tag-eliminar" onclick="eliminarServicio(${s.id})">&times;</span></div>`).join('');
    actualizarSumaTotalExtra();
}
window.eliminarServicio = function(id) { serviciosSeleccionados = serviciosSeleccionados.filter(s => s.id !== id); actualizarTagsServicios(); };

function actualizarTagsGatos() {
    document.getElementById('tags-gatos').innerHTML = gatosExtraSeleccionados.map(g => `<div class="tag-gato">${g} <span class="tag-eliminar" onclick="eliminarGatoExtra('${g}')">&times;</span></div>`).join('');
    actualizarSumaTotalExtra();
}
window.eliminarGatoExtra = function(nombre) { gatosExtraSeleccionados = gatosExtraSeleccionados.filter(g => g !== nombre); actualizarTagsGatos(); };

function actualizarTagsServiciosCli() {
    document.getElementById('tags-servicios-cli').innerHTML = serviciosSeleccionadosCli.map(s => `<div class="tag-servicio">${s.nombre} <span class="tag-eliminar" onclick="eliminarServicioCli(${s.id})">&times;</span></div>`).join('');
    actualizarMontoCli(); 
}
window.eliminarServicioCli = function(id) { serviciosSeleccionadosCli = serviciosSeleccionadosCli.filter(s => s.id !== id); actualizarTagsServiciosCli(); };

function guardarExtra(evento) {
    evento.preventDefault();
    const pcSelect = document.getElementById('pc-extra').value;
    const montoExtra = parseInt(document.getElementById('monto-extra').value) || 0;
    const nuevoGato = document.getElementById('cambio-gato-extra').value;
    let horasExtra = serviciosSeleccionados.reduce((acc, s) => acc + s.horas, 0);

    if (!pcSelect) return;
    const pcIndex = estadoPCs.findIndex(p => p.id === pcSelect);
    const cliIndex = registroClientes.findIndex(c => c.pc === pcSelect && c.activo);
    if (pcIndex === -1 || cliIndex === -1) return;

    if (montoExtra > 0) registroClientes[cliIndex].monto += montoExtra;
    if (horasExtra > 0) { estadoPCs[pcIndex].horasAsignadas += horasExtra; registroClientes[cliIndex].horas += horasExtra; }

    let gatosAsignados = estadoPCs[pcIndex].gato === 'Sin acompañante' ? [] : estadoPCs[pcIndex].gato.split(', ');

    if (nuevoGato !== "") {
        if (gatosAsignados[0] && gatosAsignados[0] !== '') {
            let idx = estadoGatos.findIndex(g => g.nombre === gatosAsignados[0]);
            if (idx !== -1) { estadoGatos[idx].estado = 'Disponible'; estadoGatos[idx].asignacion = 'Ninguna'; }
            gatosAsignados.shift(); 
        }
        if (nuevoGato !== 'QUITAR') {
            let idx = estadoGatos.findIndex(g => g.nombre === nuevoGato);
            if (idx !== -1) { estadoGatos[idx].estado = 'Ocupado'; estadoGatos[idx].asignacion = `Cliente: ${estadoPCs[pcIndex].cliente}`; gatosAsignados.unshift(nuevoGato); }
        }
    }

    gatosExtraSeleccionados.forEach(nom => {
        let idx = estadoGatos.findIndex(g => g.nombre === nom);
        if (idx !== -1) { estadoGatos[idx].estado = 'Ocupado'; estadoGatos[idx].asignacion = `Extra: ${estadoPCs[pcIndex].cliente}`; gatosAsignados.push(nom); }
    });

    let stringGatos = gatosAsignados.length > 0 ? gatosAsignados.join(', ') : 'Sin acompañante';
    estadoPCs[pcIndex].gato = stringGatos; registroClientes[cliIndex].gato = stringGatos;

    sincronizarRegistroClientes(); sincronizarPCsEncargado(); sincronizarGatosEncargado();
    alert(`Modificaciones aplicadas al ${pcSelect}.`); document.getElementById('form-extras').reset();
    cargarOpcionesPCsActivos(); actualizarVistaPCs(); actualizarTablaGatos(); cargarOpcionesGatos(); 
}

// ==========================================================================
// 8. AGENDA DE RESERVAS DE CLIENTES
// ==========================================================================
function obtenerReservasStorage() { return JSON.parse(localStorage.getItem('cybercate_reservas')) || []; }
function sincronizarReservasEncargado(res) { localStorage.setItem('cybercate_reservas', JSON.stringify(res)); }

document.getElementById('horas-reserva')?.addEventListener('input', function() {
    if(document.getElementById('monto-reserva')) document.getElementById('monto-reserva').value = (parseInt(this.value) || 0) * TARIFA_POR_HORA;
});

function guardarReserva(evento) {
    evento.preventDefault();
    const nombre = document.getElementById('nombre-reserva').value;
    const horas = parseInt(document.getElementById('horas-reserva').value);
    let agenda = obtenerReservasStorage();
    agenda.push({ id: Date.now(), nombre: nombre, fecha: document.getElementById('fecha-reserva').value, horas: horas, monto: horas * TARIFA_POR_HORA, estado: 'Pendiente' });
    sincronizarReservasEncargado(agenda); alert(`Reserva de ${nombre} guardada.`); document.getElementById('form-reserva').reset(); actualizarTablaReservas();
}

function actualizarTablaReservas() {
    let agenda = obtenerReservasStorage(); 
    const cuerpo = document.getElementById('cuerpo-reservas');
    if(!cuerpo) return;
    cuerpo.innerHTML = '';

    let optionsPCs = '<option value="">Seleccione PC...</option>' + estadoPCs.filter(pc => pc.estado === 'Disponible').map(pc => `<option value="${pc.id}">${pc.id}</option>`).join('');

    agenda.forEach(res => {
        if(res.estado !== 'Pendiente') return;
        const extraText = res.extras ? `<br><small style="color: #666;">${res.extras}</small>` : '';
        
        let optionsGatos = '<option value="">Ninguno</option>';
        estadoGatos.forEach(gato => {
            if (gato.estado === 'Disponible' || gato.nombre === res.gato) {
                optionsGatos += `<option value="${gato.nombre}" ${res.gato === gato.nombre ? 'selected' : ''}>${gato.nombre} (${gato.tipo})</option>`;
            }
        });

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><strong>${res.nombre}</strong></td><td>${new Date(res.fecha).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
            <td>${res.horas} hr(s) ${extraText}</td><td>$${res.monto.toLocaleString()}</td>
            <td><select id="pc-llegada-${res.id}" style="width: 100%; padding: 8px;">${optionsPCs}</select></td>
            <td><select id="gato-llegada-${res.id}" style="width: 100%; padding: 8px;">${optionsGatos}</select></td>
            <td style="display:flex;gap:5px;"><button onclick="activarReserva(${res.id})" style="background:#2ecc71;padding:8px;border:none;border-radius:5px;color:white;cursor:pointer;flex:1;">Iniciar</button>
            <button onclick="cancelarReserva(${res.id})" style="background:#e74c3c;padding:8px;border:none;border-radius:5px;color:white;cursor:pointer;flex:1;">Cancelar</button></td>
        `;
        cuerpo.appendChild(fila);
    });
}

function cancelarReserva(id) {
    let agenda = obtenerReservasStorage();
    let idx = agenda.findIndex(r => r.id === id);
    if(idx !== -1 && confirm(`¿Cancelar reserva de ${agenda[idx].nombre}?`)) {
        agenda[idx].estado = 'Cancelada'; sincronizarReservasEncargado(agenda); actualizarTablaReservas();
    }
}

function activarReserva(id) {
    let agenda = obtenerReservasStorage();
    let idx = agenda.findIndex(r => r.id === id);
    if(idx === -1) return;
    
    const pcSelect = document.getElementById(`pc-llegada-${id}`).value;
    const gatoSelect = document.getElementById(`gato-llegada-${id}`).value;

    if (!pcSelect) { alert("Asigna un PC disponible."); return; }
    const pcIndex = estadoPCs.findIndex(p => p.id === pcSelect);
    if (pcIndex !== -1 && confirm(`¿Iniciar sesión de ${agenda[idx].nombre} en el ${pcSelect}?`)) {
        let montoFinal = agenda[idx].monto;
        if (gatoSelect !== "") {
            let gatoIndex = estadoGatos.findIndex(g => g.nombre === gatoSelect);
            if (gatoIndex !== -1) {
                estadoGatos[gatoIndex].estado = 'Ocupado'; estadoGatos[gatoIndex].asignacion = `Cliente: ${agenda[idx].nombre}`; montoFinal += precios.gatoBase; 
            }
        }

        estadoPCs[pcIndex] = { ...estadoPCs[pcIndex], estado: 'Ocupado', cliente: agenda[idx].nombre, gato: gatoSelect || 'Sin acompañante', horaInicioMilisegundos: Date.now(), horasAsignadas: agenda[idx].horas, horaInicioStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        
        registroClientes.push({ nombre: agenda[idx].nombre, pc: pcSelect, gato: gatoSelect || 'Sin acompañante', horas: agenda[idx].horas, monto: montoFinal, activo: true });
        agenda[idx].estado = 'Completada';
        
        sincronizarReservasEncargado(agenda); sincronizarRegistroClientes(); sincronizarPCsEncargado(); sincronizarGatosEncargado(); 
        actualizarTablaReservas(); alert(`Sesión iniciada.`);
    }
}