// ==========================================================================
// PANEL DE CLIENTE
// ==========================================================================

const TARIFA_POR_HORA = 2500;

function abrirSeccion(idSeccion, nombreSeccion) {
    document.getElementById('menu-principal-cliente').classList.remove('activo');
    document.getElementById('menu-principal-cliente').classList.add('oculto');

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

    document.getElementById('menu-principal-cliente').classList.remove('oculto');
    document.getElementById('menu-principal-cliente').classList.add('activo');
    
    document.getElementById('texto-ruta').innerText = '';
    document.getElementById('btn-volver').classList.add('oculto');
    
    document.getElementById('form-reserva-cliente').reset();
    calcularTotal(); // Reinicia el precio a 0 al volver
}

// MENÚ DE PERFIL
function toggleMenuPerfil() {
    const menu = document.getElementById('menu-perfil');
    if (menu) menu.classList.toggle('activo');
}

window.onclick = function(evento) {
    if (!evento.target.matches('.btn-perfil')) {
        const menu = document.getElementById('menu-perfil');
        if (menu && menu.classList.contains('activo')) {
            menu.classList.remove('activo');
        }
    }
};

function cerrarSesion() {
    window.location.href = 'index.html';
}

// ==========================================================================
// CÁLCULO
// ==========================================================================
function calcularTotal() {
    //  Obtener precio de las horas
    const inputHoras = document.getElementById('horas-reserva');
    const horas = parseInt(inputHoras.value) || 0;
    let total = horas * TARIFA_POR_HORA;

    // Sumar el precio de los extras marcados
    const extras = document.querySelectorAll('.extra-checkbox');
    extras.forEach(checkbox => {
        if (checkbox.checked) {
            // Extraemos el valor del atributo "data-precio" de cada checkbox
            total += parseInt(checkbox.getAttribute('data-precio'));
        }
    });

    // Mostrar en el input del monto total
    const inputMontoReserva = document.getElementById('monto-reserva');
    if (inputMontoReserva) {
        inputMontoReserva.value = total > 0 ? total : '';
    }
}


document.getElementById('horas-reserva').addEventListener('input', calcularTotal);

// Escuchar cambios en los checkboxes de los extras
const checkboxesExtra = document.querySelectorAll('.extra-checkbox');
checkboxesExtra.forEach(checkbox => {
    checkbox.addEventListener('change', calcularTotal);
});


// ==========================================================================
// CONFIRMAR RESERVA
// ==========================================================================
function confirmarReserva(evento) {
    evento.preventDefault();
    
    const fecha = document.getElementById('fecha-reserva').value;
    const horas = document.getElementById('horas-reserva').value;
    const monto = document.getElementById('monto-reserva').value;

    
    let serviciosSeleccionados = [];
    const extras = document.querySelectorAll('.extra-checkbox:checked');
    extras.forEach(checkbox => {
        serviciosSeleccionados.push(checkbox.value);
    });

    const fechaFormat = new Date(fecha).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    
    
    const textoExtras = serviciosSeleccionados.length > 0 ? serviciosSeleccionados.join(', ') : 'Ninguno';

    alert(`¡Reserva confirmada con éxito!\n\nFecha: ${fechaFormat}\nTiempo: ${horas} hr(s)\nExtras: ${textoExtras}\n\nTotal a pagar en caja: $${monto}`);
    
    volverAlMenu();
}