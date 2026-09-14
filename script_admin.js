
// ==========================================================================
// 1. NAVEGACIÓN ENTRE SUBPÁGINAS Y MENÚ PRINCIPAL
// ==========================================================================

function abrirSeccion(idSeccion, nombreSeccion) {
    // 1. Ocultar el menú principal de grilla
    document.getElementById('menu-principal-admin').classList.remove('activo');
    document.getElementById('menu-principal-admin').classList.add('oculto');

    // 2. Ocultar todas las secciones funcionales para limpiar la pantalla
    const secciones = document.querySelectorAll('.seccion-funcional');
    secciones.forEach(sec => {
        sec.classList.remove('activo');
        sec.classList.add('oculto');
    });

    // 3. Mostrar la sección específica que el usuario cliqueó
    const seccionActiva = document.getElementById(idSeccion);
    if (seccionActiva) {
        seccionActiva.classList.remove('oculto');
        seccionActiva.classList.add('activo');
    }

    // 4. Actualizar el texto superior para mostrar la ruta y revelar la casa
    document.getElementById('texto-ruta').innerText = ` : ${nombreSeccion}`;
    document.getElementById('btn-volver').classList.remove('oculto');
}

function volverAlMenu() {
    // 1. Ocultar todas las subpáginas
    const secciones = document.querySelectorAll('.seccion-funcional');
    secciones.forEach(sec => {
        sec.classList.remove('activo');
        sec.classList.add('oculto');
    });

    // 2. Traer de vuelta el menú principal
    document.getElementById('menu-principal-admin').classList.remove('oculto');
    document.getElementById('menu-principal-admin').classList.add('activo');

    // 3. Limpiar la ruta y ocultar el botón de la casa
    document.getElementById('texto-ruta').innerText = '';
    document.getElementById('btn-volver').classList.add('oculto');
}

// ==========================================================================
// 2. MENÚ DE PERFIL Y GESTIÓN DE SESIÓN
// ==========================================================================

function toggleMenuPerfil() {
    const menu = document.getElementById('menu-perfil');
    if (menu) menu.classList.toggle('activo');
}

// Cierra el menú desplegable si se cliquea en cualquier otra parte de la pantalla
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
    // Redirige de vuelta al login general
    window.location.href = 'index.html';
}

function irConfiguraciones() {
    alert("Abriendo opciones de configuración del Administrador...");
}
// ==========================================================================
// 3. GESTIÓN DE EQUIPOS (PCs) - CONECTADO CON ENCARGADO
// ==========================================================================

// 1. Cargar desde LocalStorage o crear los 12 PCs por defecto la primera vez
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

// 2. Función clave que guarda los cambios en el navegador
function guardarCambiosEnStorage() {
    localStorage.setItem('cybercate_pcs', JSON.stringify(inventarioPCs));
}

function renderizarTablaPCs() {
    // Para que los cambios en otras pestañas se reflejen al instante
    inventarioPCs = JSON.parse(localStorage.getItem('cybercate_pcs')) || inventarioPCs;
    
    const cuerpoTabla = document.getElementById('cuerpo-tabla-pcs');
    if (!cuerpoTabla) return;
    cuerpoTabla.innerHTML = '';

    inventarioPCs.forEach(pc => {
        const fila = document.createElement('tr');
        let colorEstado = pc.estado === 'Disponible' ? '#2ecc71' : (pc.estado === 'Mantenimiento' ? '#f1c40f' : '#e74c3c');
        
        fila.innerHTML = `
            <td><strong>${pc.id}</strong></td>
            <td style="color: ${colorEstado}; font-weight: bold;">${pc.estado}</td>
            <td style="display: flex; gap: 10px;">
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
    guardarCambiosEnStorage(); // GUARDAMOS EL NUEVO PC
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
        
        guardarCambiosEnStorage(); // GUARDAMOS EL CAMBIO DE ESTADO
        renderizarTablaPCs();
    }
}

function eliminarPC(id) {
    const pcIndex = inventarioPCs.findIndex(pc => pc.id === id);
    if (pcIndex !== -1 && inventarioPCs[pcIndex].estado === 'Ocupado') {
        alert("No puedes eliminar un PC que está actualmente en uso.");
        return;
    }

    if (confirm(`¿Estás seguro de eliminar el equipo ${id}?`)) {
        inventarioPCs = inventarioPCs.filter(pc => pc.id !== id);
        guardarCambiosEnStorage(); // GUARDAMOS LA ELIMINACIÓN
        renderizarTablaPCs();
    }
}

document.addEventListener('DOMContentLoaded', renderizarTablaPCs);
// ==========================================================================
// 4. CONFIGURACIÓN DE PRECIOS GLOBALES
// ==========================================================================

// 1. Cargar precios desde LocalStorage o usar valores por defecto (en CLP)
let preciosGlobales = JSON.parse(localStorage.getItem('cybercate_precios')) || {
    horaBase: 2500,
    horaExtra: 1000,
    gatoBase: 0,
    gatoExtra: 1500,
    bebida: 1200,
    snack: 800,
    imprimir: 500
};

// 2. Inyectar los valores guardados en el formulario de HTML
function cargarPreciosEnFormulario() {
    const form = document.getElementById('form-precios');
    if (!form) return; // Si la sección no existe, no hacemos nada

    document.getElementById('precio-hora-base').value = preciosGlobales.horaBase;
    document.getElementById('precio-hora-extra').value = preciosGlobales.horaExtra;
    document.getElementById('precio-gato-base').value = preciosGlobales.gatoBase;
    document.getElementById('precio-gato-extra').value = preciosGlobales.gatoExtra;
    document.getElementById('precio-bebida').value = preciosGlobales.bebida;
    document.getElementById('precio-snack').value = preciosGlobales.snack;
}

// 3. Guardar los nuevos valores enviados por el Administrador
function guardarPrecios(evento) {
    evento.preventDefault(); // Evita que la página se recargue
    
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

// Cargar los datos visuales al iniciar la página del Administrador
document.addEventListener('DOMContentLoaded', () => {
    if (typeof renderizarTablaPCs === 'function') renderizarTablaPCs();
    cargarPreciosEnFormulario(); // Ejecutamos la carga del formulario de precios
});