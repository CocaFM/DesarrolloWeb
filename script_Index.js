/* ========================================================================== */
/* COMPONENTE ALPINE: authApp (Control de Autenticación y Registro)           */
/* ========================================================================== */
document.addEventListener('alpine:init', () => {
    Alpine.data('authApp', () => ({
        
        // ==================================================================
        // 1. VARIABLES DE ESTADO Y FORMULARIOS
        // Controlan la vista activa, alertas, datos escritos y el overlay.
        // ==================================================================
        vista: 'login',
        cargando: false,
        datosCargados: false,
        mensajeError: '',
        
        // Control de la imagen temporal y del juego Snake
        mostrarImagenTemporal: false,
        temporizadorImagen: null,
        mostrarSnake: false,
        registroClicsSecretos: [],

        verPasswordLogin: false, //Controla el ojo de la clave
        
        loginData: { correo: '', password: '' },
        regData: { nombre: '', correo: '', password: '', confirm: '' },
        
        // Listas en memoria donde se almacenan los usuarios leídos de los JSON
        listaAdmins: [],
        listaEncargados: [],
        listaClientes: [],

        // ==================================================================
        // 2. INICIALIZACIÓN Y CARGA ASÍNCRONA CON FETCH()
        // Descarga los 3 JSON de cuentas al abrir la página.
        // ==================================================================
        async init() {
            await this.cargarCuentasJSON();
        },

        async cargarCuentasJSON() {
            // Si ya se cargaron antes en esta sesión, no sobrescribe la memoria
            if (this.datosCargados) return true;

            this.cargando = true;
            this.mensajeError = '';

            try {
                const [resAdm, resEnc, resCli] = await Promise.all([
                    fetch('Json_administradores.json'),
                    fetch('Json_encargados.json'),
                    fetch('Json_clientes.json')
                ]);

                if (!resAdm.ok || !resEnc.ok || !resCli.ok) throw new Error();

                this.listaAdmins = await resAdm.json();
                this.listaEncargados = await resEnc.json();
                this.listaClientes = await resCli.json();
                this.datosCargados = true;
                return true;
            } catch (error) {
                this.mensajeError = "Error al cargar los JSON. Asegúrate de iniciar un Live Server.";
                return false;
            } finally {
                this.cargando = false;
            }
        },

        // ==================================================================
        // 3. CAMBIO ENTRE VISTAS (LOGIN / REGISTRO) Y FUNCIÓN BOTÓN VERDE
        // ==================================================================
        mostrarRegistro() { 
            this.mensajeError = ''; 
            this.vista = 'registro'; 
        },
        
        volverLogin() { 
            this.mensajeError = ''; 
            this.vista = 'login'; 
            this.regData = { nombre: '', correo: '', password: '', confirm: '' }; 
        },


        // Registra los clics, reproduce audio/imagen y al 3er clic abre el Snake
        registrarClicSecreto() {
            const audio = document.getElementById('audio-secreto');
            
            // Reiniciar y reproducir el sonido desde el principio
            if (audio) {
                audio.currentTime = 0; 
                audio.play().catch(e => console.log("El navegador bloqueó el autoplay", e));
            }

            // 1. Mostrar la imagen de golpe por 2 segundos (2000 ms)
            this.mostrarImagenTemporal = true;
            if (this.temporizadorImagen) clearTimeout(this.temporizadorImagen);
            
            this.temporizadorImagen = setTimeout(() => {
                this.mostrarImagenTemporal = false;
                if (audio) audio.pause(); // Detener la canción cuando se va la imagen
            }, 2000);

            // 2. Lógica del conteo para el juego Snake (1:30 minutos = 90000 ms)
            const ahora = Date.now();
            this.registroClicsSecretos.push(ahora);
            
            this.registroClicsSecretos = this.registroClicsSecretos.filter(t => ahora - t <= 90000);
            
            if (this.registroClicsSecretos.length >= 3) {
                setTimeout(() => {
                    this.mostrarImagenTemporal = false; 
                    if (audio) audio.pause(); // Asegurar que el sonido pare si salta el juego
                    
                    this.mostrarSnake = true;           
                    iniciarJuegoSnake();                
                }, 500); 
                
                this.registroClicsSecretos = []; 
            }
        },

        // Cierra la ventana del Snake
        cerrarSnake() {
            this.mostrarSnake = false;
            detenerJuegoSnake();
        },

        // ==================================================================
        // 4. VALIDACIÓN DE INICIO DE SESIÓN Y REDIRECCIÓN POR ROL
        // Busca el correo en Admins, Encargados o Clientes y redirige.
        // ==================================================================
        async procesarLogin() {
            this.mensajeError = '';
            const ok = await this.cargarCuentasJSON();
            if (!ok) return;

            const correo = this.loginData.correo.trim().toLowerCase();
            const password = this.loginData.password.trim();
            let rol = null;
            let nombreUsuario = '';

            const admin = this.listaAdmins.find(u => u.correo.toLowerCase() === correo && u.pass === password);
            const encargado = this.listaEncargados.find(u => u.correo.toLowerCase() === correo && u.pass === password);
            const cliente = this.listaClientes.find(u => u.correo.toLowerCase() === correo && u.pass === password);

            if (admin) { rol = 'admin'; nombreUsuario = admin.nombre || correo; } 
            else if (encargado) { rol = 'encargado'; nombreUsuario = encargado.nombre || correo; } 
            else if (cliente) { rol = 'cliente'; nombreUsuario = cliente.nombre || correo; }

            if (rol) {
                // Envía los datos del usuario conectado a través de parámetros en la URL
                window.location.href = `${rol}.html?correo=${encodeURIComponent(correo)}&nombre=${encodeURIComponent(nombreUsuario)}`;
            } else {
                this.mensajeError = "Acceso denegado: Credenciales incorrectas.";
            }
        },

        // ==================================================================
        // 5. REGISTRO DE NUEVAS CUENTAS EN MEMORIA
        // Verifica duplicados y agrega el cliente al arreglo temporal.
        // ==================================================================
        async procesarRegistro() {
            // 1. Validar que las contraseñas coincidan
            if (this.regData.password !== this.regData.confirm) {
                this.mensajeError = "Las contraseñas no coinciden.";
                return;
            }
            
            this.cargando = true;
            this.mensajeError = "";

            try {
                // 2. Enviar los datos a la ruta de registro de tu server.js
                const respuesta = await fetch('/api/registro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: this.regData.nombre,
                        usuario: this.regData.correo, 
                        clave: this.regData.password  
                    })
                });

                const data = await respuesta.json(); 

                // 3. Verificar si el registro fue exitoso
                if (respuesta.ok) {
                    alert("¡Cuenta creada exitosamente en MongoDB Atlas!");
                    this.volverLogin(); // Oculta el registro y vuelve al login
                    // Limpiar los campos del formulario
                    this.regData = { nombre: '', correo: '', password: '', confirm: '' };
                } else {
                    
                    this.mensajeError = data.mensaje || "Error al registrar el usuario.";
                }
            } catch (error) {
                this.mensajeError = "Error de conexión con el servidor.";
            } finally {
                this.cargando = false;
            }
        },
    }));
});

/* ========================================================================== */
/* MOTOR DEL JUEGO SNAKE (Fuera de Alpine para mejor rendimiento)             */
/* ========================================================================== */
let bucleJuegoSnake;
let serpiente, comida, dx, dy;
let puntuacionSnake = 0;
const cuadricula = 20;

function iniciarJuegoSnake() {
    const canvas = document.getElementById('lienzo-snake');
    if (!canvas) return;
    
    // Ocultar pantalla de perder si estaba visible
    document.getElementById('pantalla-perdiste').style.display = 'none';
    
    // Reiniciar puntuación en la interfaz y en memoria
    puntuacionSnake = 0;
    document.getElementById('marcador-snake').innerText = 'Manzanas: 0';
    
    // Nueva posición central para el tablero de 600x600
    serpiente = [{ x: 300, y: 300 }, { x: 280, y: 300 }, { x: 260, y: 300 }];
    dx = cuadricula; 
    dy = 0;
    
    generarComidaSnake(canvas);
    document.addEventListener('keydown', cambiarDireccionSnake);
    
    if (bucleJuegoSnake) clearInterval(bucleJuegoSnake);
    bucleJuegoSnake = setInterval(() => actualizarJuegoSnake(canvas), 100);
}

function detenerJuegoSnake() {
    clearInterval(bucleJuegoSnake);
    document.removeEventListener('keydown', cambiarDireccionSnake);
}

function actualizarJuegoSnake(canvas) {
    const ctx = canvas.getContext('2d');
    const cabeza = { x: serpiente[0].x + dx, y: serpiente[0].y + dy };
    serpiente.unshift(cabeza);

    // Si come la manzana
    if (cabeza.x === comida.x && cabeza.y === comida.y) {
        puntuacionSnake++;
        document.getElementById('marcador-snake').innerText = 'Manzanas: ' + puntuacionSnake;
        generarComidaSnake(canvas);
    } else {
        serpiente.pop();
    }

    // Colisiones con la pared o consigo misma
    if (cabeza.x < 0 || cabeza.x >= canvas.width || cabeza.y < 0 || cabeza.y >= canvas.height || colisionSerpiente(cabeza)) {
        detenerJuegoSnake();
        // Muestra el menú oscuro sobre el juego con el botón de reiniciar
        document.getElementById('pantalla-perdiste').style.display = 'flex';
        return;
    }

    // Dibujar fondo
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar manzana
    ctx.fillStyle = 'red';
    ctx.fillRect(comida.x, comida.y, cuadricula, cuadricula);

    // Dibujar serpiente
    ctx.fillStyle = 'lime';
    serpiente.forEach(parte => {
        ctx.fillRect(parte.x, parte.y, cuadricula - 1, cuadricula - 1);
    });
}

function cambiarDireccionSnake(evento) {
    const TECLA_IZQ = 37, TECLA_ARR = 38, TECLA_DER = 39, TECLA_ABA = 40;
    if (evento.keyCode === TECLA_IZQ && dx === 0) { dx = -cuadricula; dy = 0; }
    if (evento.keyCode === TECLA_ARR && dy === 0) { dx = 0; dy = -cuadricula; }
    if (evento.keyCode === TECLA_DER && dx === 0) { dx = cuadricula; dy = 0; }
    if (evento.keyCode === TECLA_ABA && dy === 0) { dx = 0; dy = cuadricula; }
    
    if([37, 38, 39, 40].includes(evento.keyCode)) evento.preventDefault();
}

function generarComidaSnake(canvas) {
    comida = {
        x: Math.floor(Math.random() * (canvas.width / cuadricula)) * cuadricula,
        y: Math.floor(Math.random() * (canvas.height / cuadricula)) * cuadricula
    };
}

function colisionSerpiente(cabeza) {
    for (let i = 1; i < serpiente.length; i++) {
        if (cabeza.x === serpiente[i].x && cabeza.y === serpiente[i].y) return true;
    }
    return false;
}