
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