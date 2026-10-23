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
        
        // Estado para controlar la imagen a pantalla completa por 3 segundos
        mostrarImagenTemporal: false,
        temporizadorImagen: null,
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

        // Muestra la imagen de golpe durante 2 segundos (2000 ms) y la quita bruscamente
        activarImagenTemporal() {
            this.mostrarImagenTemporal = true;
            if (this.temporizadorImagen) clearTimeout(this.temporizadorImagen);
            
            this.temporizadorImagen = setTimeout(() => {
                this.mostrarImagenTemporal = false;
            }, 2000); // 2000 milisegundos = 2 segundos exactos
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
            this.mensajeError = '';
            if (this.regData.password !== this.regData.confirm) {
                this.mensajeError = "Las contraseñas no coinciden.";
                return;
            }
            
            const ok = await this.cargarCuentasJSON();
            if (!ok) return;

            const correo = this.regData.correo.trim().toLowerCase();
            const existe = this.listaAdmins.some(u => u.correo.toLowerCase() === correo) ||
                           this.listaEncargados.some(u => u.correo.toLowerCase() === correo) ||
                           this.listaClientes.some(u => u.correo.toLowerCase() === correo);

            if (existe) {
                this.mensajeError = "Este correo ya está registrado.";
                return;
            }

            // Guarda el nuevo cliente en la memoria de la sesión actual
            this.listaClientes.push({
                id: 'CLI-' + Date.now().toString().slice(-4),
                correo: correo,
                pass: this.regData.password.trim(),
                nombre: this.regData.nombre.trim()
            });
            
            alert(`¡Cuenta creada para ${this.regData.nombre}!\n\nNota: El registro se mantiene en memoria y se perderá al recargar la página.`);
            this.volverLogin();
        }
    }));
});