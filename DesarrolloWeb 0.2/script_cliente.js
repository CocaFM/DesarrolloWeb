// ==========================================================================
// 1. OBTENCIÓN DE DATOS (PRECIOS Y GATOS)
// ==========================================================================
function obtenerPreciosCliente() {
    let preciosGuardados = JSON.parse(localStorage.getItem('cybercate_precios'));
    if (!preciosGuardados || isNaN(preciosGuardados.horaBase)) {
        return { horaBase: 2500, horaExtra: 1000, gatoBase: 0, gatoExtra: 1500, bebida: 1200, snack: 800, imprimir: 150 };
    }
    return preciosGuardados;
}

const preciosCliente = obtenerPreciosCliente();
const TARIFA_POR_HORA = preciosCliente.horaBase;

document.addEventListener('DOMContentLoaded', () => {
    // Inyecta los precios visualmente en el formulario
    const txtHora = document.getElementById('txt-precio-hora');
    if(txtHora) txtHora.innerText = `$${preciosCliente.horaBase} c/u`;
    const txtGato = document.getElementById('txt-precio-gato-base');
    if(txtGato) txtGato.innerText = preciosCliente.gatoBase > 0 ? `+$${preciosCliente.gatoBase}` : 'Gratis / Incluido';
    
    cargarGatosCliente();
});

function cargarGatosCliente() {
    const selectGato = document.getElementById('gato-reserva-cli');
    if (!selectGato) return;
    
    // Forzamos "Sin acompañante" como la opción 0 SIEMPRE
    selectGato.innerHTML = '<option value="">Sin acompañante</option>';
    
    let estadoGatos = JSON.parse(localStorage.getItem('cybercate_gatos')) || [
        { id: 1, nombre: 'Estrella', tipo: 'Siamesa', estado: 'Disponible' },
        { id: 2, nombre: 'Simba', tipo: 'Atigrado', estado: 'Disponible' }
    ];

    if (!localStorage.getItem('cybercate_gatos')) {
        localStorage.setItem('cybercate_gatos', JSON.stringify(estadoGatos));
    }
    
    estadoGatos.forEach(gato => {
        if (gato.estado === 'Disponible') {
            const opcion = document.createElement('option');
            opcion.value = gato.nombre;
            opcion.textContent = `${gato.nombre} (${gato.tipo})`;
            selectGato.appendChild(opcion);
        }
    });
}

// ==========================================================================
// 2. NAVEGACIÓN Y MENÚ
// ==========================================================================
function abrirSeccion(idSeccion, nombreSeccion) {
    document.getElementById('menu-principal-cliente').classList.remove('activo');
    document.getElementById('menu-principal-cliente').classList.add('oculto');
    document.querySelectorAll('.seccion-funcional').forEach(sec => { sec.classList.remove('activo'); sec.classList.add('oculto'); });

    const seccionActiva = document.getElementById(idSeccion);
    if (seccionActiva) {
        seccionActiva.classList.remove('oculto');
        seccionActiva.classList.add('activo');
    }
    document.getElementById('texto-ruta').innerText = ` : ${nombreSeccion}`;
    document.getElementById('btn-volver').classList.remove('oculto');
}

function volverAlMenu() {
    document.querySelectorAll('.seccion-funcional').forEach(sec => { sec.classList.remove('activo'); sec.classList.add('oculto'); });
    document.getElementById('menu-principal-cliente').classList.remove('oculto');
    document.getElementById('menu-principal-cliente').classList.add('activo');
    document.getElementById('texto-ruta').innerText = '';
    document.getElementById('btn-volver').classList.add('oculto');
    
    document.getElementById('form-reserva-cliente').reset();
    calcularTotal(); 
}

function toggleMenuPerfil() {
    const menu = document.getElementById('menu-perfil');
    if (menu) menu.classList.toggle('activo');
}

window.onclick = function(evento) {
    if (!evento.target.matches('.btn-perfil')) {
        const menu = document.getElementById('menu-perfil');
        if (menu && menu.classList.contains('activo')) { menu.classList.remove('activo'); }
    }
};

function cerrarSesion() { window.location.href = 'index.html'; }

// ==========================================================================
// 3. CÁLCULO DE COSTOS EN TIEMPO REAL
// ==========================================================================
function calcularTotal() {
    const inputHoras = document.getElementById('horas-reserva');
    const horas = parseInt(inputHoras.value) || 0;
    let total = horas * TARIFA_POR_HORA;

    const gatoSelect = document.getElementById('gato-reserva-cli');
    if (gatoSelect && gatoSelect.value !== "") {
        total += preciosCliente.gatoBase;
    }

    const inputMontoReserva = document.getElementById('monto-reserva');
    if (inputMontoReserva) {
        inputMontoReserva.value = total > 0 ? total : '';
    }
}

document.getElementById('horas-reserva')?.addEventListener('input', calcularTotal);
document.getElementById('gato-reserva-cli')?.addEventListener('change', calcularTotal);

// ==========================================================================
// 4. ENVÍO DE LA RESERVA (A LA BD DEL ENCARGADO)
// ==========================================================================
function confirmarReserva(evento) {
    evento.preventDefault();
    
    const nombre = document.getElementById('nombre-reserva-cli').value.trim();
    const fecha = document.getElementById('fecha-reserva').value;
    const horas = parseInt(document.getElementById('horas-reserva').value) || 0;
    const monto = parseInt(document.getElementById('monto-reserva').value) || 0;
    const gatoPedido = document.getElementById('gato-reserva-cli').value;

    let infoGato = gatoPedido !== "" ? `Acompañante principal: ${gatoPedido}` : 'Sin acompañante';
    let agendaReservas = JSON.parse(localStorage.getItem('cybercate_reservas')) || [];
    
    agendaReservas.push({
        id: Date.now(), 
        nombre: nombre,
        fecha: fecha,
        horas: horas,
        monto: monto,
        gato: gatoPedido, 
        extras: infoGato, 
        estado: 'Pendiente'
    });

    localStorage.setItem('cybercate_reservas', JSON.stringify(agendaReservas));

    const fechaFormat = new Date(fecha).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    alert(`¡Reserva confirmada con éxito!\n\nNombre: ${nombre}\nFecha: ${fechaFormat}\nTiempo: ${horas} hr(s)\n${infoGato}\n\nTotal a pagar en caja: $${monto}`);
    volverAlMenu();
}