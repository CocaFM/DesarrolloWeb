const menuPrincipal = document.getElementById('menu-principal');
const seccionLogin = document.getElementById('seccion-login');
const seccionRegistro = document.getElementById('seccion-registro');

function volverMenu() {
    if(seccionLogin) seccionLogin.className = 'seccion-oculta';
    if(seccionRegistro) seccionRegistro.className = 'seccion-oculta';
    
    if(document.getElementById('form-login')) document.getElementById('form-login').reset();
    if(document.getElementById('form-registro')) document.getElementById('form-registro').reset();

    if(menuPrincipal) menuPrincipal.className = 'seccion-activa';
}

function mostrarLogin(rol) {
    menuPrincipal.className = 'seccion-oculta';
    seccionLogin.className = 'seccion-activa';
    
    document.getElementById('rol-login').value = rol;
    document.getElementById('titulo-login').innerText = 'Iniciar Sesión - ' + (rol === 'administrador' ? 'Administrador' : 'Encargado');
}

function mostrarRegistro() {
    menuPrincipal.className = 'seccion-oculta';
    seccionRegistro.className = 'seccion-activa';
}

function procesarLogin(evento) {
    evento.preventDefault(); 

    const rol = document.getElementById('rol-login').value;
    const correo = document.getElementById('correo-login').value;
    const password = document.getElementById('password-login').value;

    if (correo === "coca123@ds.com" && password === "123") {
        if (rol === 'administrador') {
            window.location.href = 'admin.html';
        } else if (rol === 'encargado') {
            window.location.href = 'encargado.html';
        }
    } else {
        alert("Acceso denegado: El correo electrónico o la contraseña son incorrectos.");
    }
}

function procesarRegistro(evento) {
    evento.preventDefault();

    const pass = document.getElementById('password-reg').value;
    const confirmPass = document.getElementById('confirm-password-reg').value;

    if (pass !== confirmPass) {
        alert("Error: Las contraseñas no coinciden. Inténtalo de nuevo.");
        return; 
    }

    alert(`¡Cuenta creada con éxito! Ahora puedes iniciar sesión.`);
    volverMenu();
}