// ==========================================
// MENÚ DE PERFIL Y SESIÓN (ADMIN)
// ==========================================

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