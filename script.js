const seccionLogin = document.getElementById('seccion-login');
const seccionRegistro = document.getElementById('seccion-registro');

function volverMenu() {
    if(seccionLogin) seccionLogin.className = 'seccion-activa';
    if(seccionRegistro) seccionRegistro.className = 'seccion-oculta';
    
    if(document.getElementById('form-login')) document.getElementById('form-login').reset();
    if(document.getElementById('form-registro')) document.getElementById('form-registro').reset();

}

function mostrarRegistro() {
    seccionLogin.className = 'seccion-oculta';
    seccionRegistro.className = 'seccion-activa';
}

function procesarLogin(evento) {
    evento.preventDefault(); 

    const correo = document.getElementById('correo-login').value.toLowerCase();
    const password = document.getElementById('password-login').value;

    if (correo === "admin@mail.com" && password === "123") {
        window.location.href = 'admin.html';
    } 
    else if (correo === "encargado@mail.com" && password === "123") {
        window.location.href = 'encargado.html';
    } 
    else if (correo === "cliente@mail.com" && password === "123") {
        window.location.href = 'cliente.html';
    } 
    else{
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