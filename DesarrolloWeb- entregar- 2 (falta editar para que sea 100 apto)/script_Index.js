document.addEventListener('alpine:init', () => {
    Alpine.data('authApp', () => ({
        vista: 'login',
        cargando: false,
        mensajeError: '',
        
        loginData: { correo: '', password: '' },
        regData: { nombre: '', correo: '', password: '', confirm: '' },
        
        listaAdmins: [],
        listaEncargados: [],
        listaClientes: [],

        // ==========================================
        // CARGA ASINCRÓNICA CON FETCH()
        // ==========================================
        async cargarCuentasJSON() {
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
                return true;
            } catch (error) {
                this.mensajeError = "Error al cargar los JSON. Asegúrate de iniciar un Live Server.";
                return false;
            } finally {
                this.cargando = false;
            }
        },

        mostrarRegistro() { this.mensajeError = ''; this.vista = 'registro'; },
        volverLogin() { this.mensajeError = ''; this.vista = 'login'; this.regData = { nombre: '', correo: '', password: '', confirm: '' }; },

        // ==========================================
        // PROCESAR LOGIN 
        // ==========================================
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
                // Pasa credenciales por URL, sin usar localStorage
                window.location.href = `${rol}.html?correo=${encodeURIComponent(correo)}&nombre=${encodeURIComponent(nombreUsuario)}`;
            } else {
                this.mensajeError = "Acceso denegado: Credenciales incorrectas.";
            }
        },

        // ==========================================
        // PROCESAR REGISTRO
        // ==========================================
        async procesarRegistro() {
            this.mensajeError = '';
            if (this.regData.password !== this.regData.confirm) return this.mensajeError = "Las contraseñas no coinciden.";
            
            const ok = await this.cargarCuentasJSON();
            if (!ok) return;

            const correo = this.regData.correo.trim().toLowerCase();
            const existe = this.listaAdmins.some(u => u.correo.toLowerCase() === correo) ||
                           this.listaEncargados.some(u => u.correo.toLowerCase() === correo) ||
                           this.listaClientes.some(u => u.correo.toLowerCase() === correo);

            if (existe) return this.mensajeError = "Este correo ya está registrado.";

            // Añade temporalmente a memoria
            this.listaClientes.push({
                id: Date.now(), correo: correo, pass: this.regData.password.trim(), nombre: this.regData.nombre.trim()
            });
            
            alert(`¡Cuenta creada para ${this.regData.nombre}!\n\nNota: El registro se perderá al recargar la página (Frontend sin persistencia backend).`);
            this.volverLogin();
        }
    }));
});