/* ========================================================================== */
/* COMPONENTE ALPINE: authApp (Control de Autenticación, Registro y Secreto)   */
/* ========================================================================== */
document.addEventListener('alpine:init', () => {
    Alpine.data('authApp', () => ({
        
        // ==================================================================
        // 1. VARIABLES DE ESTADO Y FORMULARIOS
        // ==================================================================
        vista: 'login',
        cargando: false,
        datosCargados: false,
        mensajeError: '',
        
        // Control de la imagen temporal, audio y juego Snake secreto
        mostrarImagenTemporal: false,
        temporizadorImagen: null,
        mostrarSnake: false,
        registroClicsSecretos: [],

        verPasswordLogin: false, // Controla el botón para ver la contraseña
        
        loginData: { correo: '', password: '' },
        regData: { nombre: '', correo: '', password: '', confirm: '' },
        
        // Listas en memoria donde se almacenan los usuarios leídos
        listaAdmins: [],
        listaEncargados: [],
        listaClientes: [],

        // ==================================================================
        // 2. INICIALIZACIÓN
        // ==================================================================
        async init() {
            await this.cargarCuentasJSON();
        },

        async cargarCuentasJSON() {
            if (this.datosCargados) return true;

            try {
                const [resAdm, resEnc, resCli] = await Promise.all([
                    fetch('Json_administradores.json').catch(() => null),
                    fetch('Json_encargados.json').catch(() => null),
                    fetch('Json_clientes.json').catch(() => null)
                ]);

                if (resAdm && resAdm.ok) this.listaAdmins = await resAdm.json();
                if (resEnc && resEnc.ok) this.listaEncargados = await resEnc.json();
                if (resCli && resCli.ok) this.listaClientes = await resCli.json();

                this.datosCargados = true;
                return true;
            } catch (error) {
                console.warn("Aviso al cargar JSONs de respaldo:", error);
                return false;
            }
        },

        // ==================================================================
        // 3. CAMBIO ENTRE VISTAS (LOGIN / REGISTRO)
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

        // ==================================================================
        // 4. FUNCIÓN SECRETA: AUDIO, IMAGEN BRUSCA Y ACTIVACIÓN DE SNAKE
        // ==================================================================
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
                if (audio) audio.pause();
            }, 2000);

            // 2. Conteo para el juego Snake (3 clics en menos de 90 segundos)
            const ahora = Date.now();
            this.registroClicsSecretos.push(ahora);
            this.registroClicsSecretos = this.registroClicsSecretos.filter(t => ahora - t <= 90000);
            
            if (this.registroClicsSecretos.length >= 3) {
                setTimeout(() => {
                    this.mostrarImagenTemporal = false; 
                    if (audio) audio.pause();
                    this.mostrarSnake = true;           
                    iniciarJuegoSnake();                
                }, 500); 
                
                this.registroClicsSecretos = []; 
            }
        },

        cerrarSnake() {
            this.mostrarSnake = false;
            detenerJuegoSnake();
        },

        // ==================================================================
        // 5. INICIO DE SESIÓN CONECTADO A MONGODB ATLAS (CON FALLBACK)
        // ==================================================================
        async procesarLogin() {
            this.mensajeError = '';
            this.cargando = true;

            const correo = this.loginData.correo.trim().toLowerCase();
            const password = this.loginData.password.trim();

            // 1. Intento principal contra la API de MongoDB Atlas
            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        usuario: correo,
                        correo: correo,
                        clave: password,
                        password: password
                    })
                });

                const data = await res.json();

                if (res.ok) {
                    const rolDestino = data.rol === 'administrador' ? 'admin' : data.rol;
                    window.location.href = `${rolDestino}.html?correo=${encodeURIComponent(correo)}&nombre=${encodeURIComponent(data.nombre || correo)}`;
                    return;
                } else if (res.status === 401 || res.status === 400) {
                    this.mensajeError = data.mensaje || "Credenciales incorrectas.";
                    this.cargando = false;
                    return;
                }
            } catch (err) {
                console.warn("Servidor no detectado o fuera de línea. Comprobando en datos locales...");
            }

            // 2. Fallback en memoria/JSON si el servidor no está corriendo
            await this.cargarCuentasJSON();

            const admin = this.listaAdmins.find(u => (u.correo || u.usuario || '').toLowerCase() === correo && (u.pass === password || u.clave === password));
            const encargado = this.listaEncargados.find(u => (u.correo || u.usuario || '').toLowerCase() === correo && (u.pass === password || u.clave === password));
            const cliente = this.listaClientes.find(u => (u.correo || u.usuario || '').toLowerCase() === correo && (u.pass === password || u.clave === password));

            let rol = null;
            let nombreUsuario = '';

            if (admin) { rol = 'admin'; nombreUsuario = admin.nombre || correo; } 
            else if (encargado) { rol = 'encargado'; nombreUsuario = encargado.nombre || correo; } 
            else if (cliente) { rol = 'cliente'; nombreUsuario = cliente.nombre || correo; }

            this.cargando = false;

            if (rol) {
                window.location.href = `${rol}.html?correo=${encodeURIComponent(correo)}&nombre=${encodeURIComponent(nombreUsuario)}`;
            } else {
                this.mensajeError = "Acceso denegado: Credenciales incorrectas.";
            }
        },

        // ==================================================================
        // 6. REGISTRO DE USUARIOS CONECTADO A MONGODB ATLAS
        // ==================================================================
        async procesarRegistro() {
            if (this.regData.password !== this.regData.confirm) {
                this.mensajeError = "Las contraseñas no coinciden.";
                return;
            }
            
            this.cargando = true;
            this.mensajeError = "";

            const nombre = this.regData.nombre.trim();
            const correo = this.regData.correo.trim().toLowerCase();
            const password = this.regData.password.trim();

            try {
                const respuesta = await fetch('/api/registro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: nombre,
                        usuario: correo, 
                        correo: correo,
                        clave: password,
                        password: password  
                    })
                });

                const data = await respuesta.json(); 

                if (respuesta.ok) {
                    alert(`¡Cuenta creada exitosamente para ${nombre} en MongoDB Atlas! Ya puedes iniciar sesión.`);
                    this.volverLogin();
                    return;
                } else if (respuesta.status === 409) {
                    this.mensajeError = data.mensaje || "Este usuario ya está registrado en Atlas.";
                    return;
                } else {
                    this.mensajeError = data.mensaje || "Error al registrar el usuario.";
                    return;
                }
            } catch (error) {
                console.warn("Servidor fuera de línea, guardando registro en memoria...");
            } finally {
                this.cargando = false;
            }

            // Fallback en memoria si la API estuviera inaccesible
            this.listaClientes.push({
                id: 'CLI-' + Date.now().toString().slice(-4),
                correo: correo,
                pass: password,
                nombre: nombre
            });
            alert(`¡Cuenta creada para ${nombre}!\n(Guardado localmente. Asegúrate de iniciar la API para guardar en Atlas).`);
            this.volverLogin();
        }
    }));
});

/* ========================================================================== */
/* MOTOR DEL JUEGO SNAKE (Canvas nativo de alto rendimiento)                  */
/* ========================================================================== */
let bucleJuegoSnake;
let serpiente, comida, dx, dy;
let puntuacionSnake = 0;
const cuadricula = 20;

function iniciarJuegoSnake() {
    const canvas = document.getElementById('lienzo-snake');
    if (!canvas) return;
    
    const pantallaPerdiste = document.getElementById('pantalla-perdiste');
    if (pantallaPerdiste) pantallaPerdiste.style.display = 'none';
    
    puntuacionSnake = 0;
    const marcador = document.getElementById('marcador-snake');
    if (marcador) marcador.innerText = 'Manzanas: 0';
    
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

    if (cabeza.x === comida.x && cabeza.y === comida.y) {
        puntuacionSnake++;
        const marcador = document.getElementById('marcador-snake');
        if (marcador) marcador.innerText = 'Manzanas: ' + puntuacionSnake;
        generarComidaSnake(canvas);
    } else {
        serpiente.pop();
    }

    if (cabeza.x < 0 || cabeza.x >= canvas.width || cabeza.y < 0 || cabeza.y >= canvas.height || colisionSerpiente(cabeza)) {
        detenerJuegoSnake();
        const pantallaPerdiste = document.getElementById('pantalla-perdiste');
        if (pantallaPerdiste) pantallaPerdiste.style.display = 'flex';
        return;
    }

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'red';
    ctx.fillRect(comida.x, comida.y, cuadricula, cuadricula);

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
