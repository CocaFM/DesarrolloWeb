/* ========================================================================== */
/* COMPONENTE ALPINE: adminApp (Lógica del Panel de Administrador)            */
/* ========================================================================== */
document.addEventListener('alpine:init', () => {
    Alpine.data('adminApp', () => ({
        
        // ==================================================================
        // 1. VARIABLES DE ESTADO, PERFIL Y BUSCADORES
        // ==================================================================
        vista: 'menu', 
        mostrarAyuda: false,
        tituloRuta: '',
        menuPerfil: false,
        modalPerfil: false,
        cargando: true,
        errorCarga: '',
        inicialPerfil: 'A',
        datosPerfil: { id: '', nombre: '', correo: '', rol: 'Administrador' },
        
        busquedaPC: '',
        busquedaCuenta: '', 

        // ==================================================================
        // 2. ARREGLOS EN MEMORIA Y MODELOS DE FORMULARIOS
        // ==================================================================
        inventarioPCs: [],
        precios: { horaBase: 2500, horaExtra: 1000, gatoBase: 0, gatoExtra: 1500, bebida: 1200, snack: 800, imprimir: 150 },
        listaAdmins: [],
        cuentasEncargados: [],
        inventarioGatos: [],
        
        nuevoPC: { id: '', estado: 'Disponible' },
        nuevaCuenta: { nombre: '', correo: '', pass: '' },
        nuevoGato: { nombre: '', tipo: '' },
        modal: { 
            cuenta: { abierto: false, data: {} }, 
            gato: { abierto: false, data: {} } 
        },

        // ==================================================================
        // 3. INICIALIZACIÓN Y CARGA DE LOS 5 ARCHIVOS JSON CON FETCH()
        // ==================================================================
        async init() {
            const params = new URLSearchParams(window.location.search);
            const correoURL = params.get('correo') || 'admin@mail.com';
            const nombreURL = params.get('nombre') || 'Administrador';
            
            this.inicialPerfil = nombreURL.trim().charAt(0).toUpperCase();
            this.datosPerfil.correo = correoURL;
            this.datosPerfil.nombre = nombreURL;
            this.datosPerfil.id = 'ADM-' + Math.floor(Math.random() * 10000);

            try {
                const [resPCs, resPrecios, resAdmins, resEncargados, resGatos] = await Promise.all([
                    fetch('Json_pcs.json'),
                    fetch('Json_productos_precios.json'),
                    fetch('Json_administradores.json'),
                    fetch('Json_encargados.json'),
                    fetch('Json_acompañantes.json') 
                ]);
                
                if (resPCs.ok) this.inventarioPCs = await resPCs.json();
                if (resPrecios.ok) {
                    const dataPrecios = await resPrecios.json();
                    this.precios = dataPrecios.tarifas || dataPrecios;
                }
                
                if (resAdmins.ok) {
                    this.listaAdmins = await resAdmins.json();
                    const adm = this.listaAdmins.find(a => a.correo.toLowerCase() === correoURL.toLowerCase());
                    if (adm && adm.nombre) {
                        this.inicialPerfil = adm.nombre.trim().charAt(0).toUpperCase();
                        this.datosPerfil.nombre = adm.nombre;
                        this.datosPerfil.id = adm.id || this.datosPerfil.id;
                    }
                }
                
                if (resEncargados.ok) this.cuentasEncargados = await resEncargados.json();
                if (resGatos.ok) this.inventarioGatos = await resGatos.json();
                
            } catch (e) {
                console.error("Error leyendo archivos JSON en Admin:", e);
                this.errorCarga = "Error al leer archivos JSON. Verifica usar Live Server.";
            } finally {
                this.cargando = false;
            }
        },

        // ==================================================================
        // 4. PROPIEDADES COMPUTADAS (FILTROS REACTIVOS CON X-MODEL)
        // ==================================================================
        get todasLasCuentas() {
            let admins = this.listaAdmins.map(a => ({ ...a, rol: 'Administrador' }));
            let encargados = this.cuentasEncargados.map(e => ({ ...e, rol: 'Encargado' }));
            let combinadas = [...admins, ...encargados];
            
            const q = this.busquedaCuenta.trim().toLowerCase();
            if (!q) return combinadas;
            return combinadas.filter(c => 
                (c.nombre && c.nombre.toLowerCase().includes(q)) || 
                (c.correo && c.correo.toLowerCase().includes(q))
            );
        },

        get pcsFiltrados() {
            const q = this.busquedaPC.trim().toLowerCase();
            if (!q) return this.inventarioPCs;
            return this.inventarioPCs.filter(pc => 
                pc.id.toLowerCase().includes(q) || 
                pc.estado.toLowerCase().includes(q)
            );
        },

        // ==================================================================
        // 5. NAVEGACIÓN ENTRE VISTAS Y MENÚ DE PERFIL
        // ==================================================================
        abrirSeccion(id, nombre) { this.vista = id; this.tituloRuta = ` : ${nombre}`; },
        volverAlMenu() { this.vista = 'menu'; this.tituloRuta = ''; },
        cerrarSesion() { window.location.href = 'index.html'; },
        irConfiguraciones() { this.menuPerfil = false; this.modalPerfil = true; },

        // ==================================================================
        // 6. FUNCIONES CRUD EN MEMORIA (PCs, PRECIOS, CUENTAS Y GATOS)
        // ==================================================================
        agregarPC() {
            if (this.inventarioPCs.find(pc => pc.id.toLowerCase() === this.nuevoPC.id.toLowerCase())) {
                return alert("Ya existe un equipo con ese ID.");
            }
            this.inventarioPCs.push({ id: this.nuevoPC.id, estado: this.nuevoPC.estado });
            this.nuevoPC = { id: '', estado: 'Disponible' };
            alert("Equipo agregado en memoria (se perderá al recargar).");
        },

        cambiarEstadoPC(id) {
            const pc = this.inventarioPCs.find(p => p.id === id);
            if (pc.estado === 'Ocupado') return alert("No puedes modificar un PC en uso.");
            pc.estado = pc.estado === 'Disponible' ? 'Mantenimiento' : 'Disponible';
        },

        eliminarPC(id) {
            const pc = this.inventarioPCs.find(p => p.id === id);
            if (pc.estado === 'Ocupado') return alert("No puedes eliminar un PC en uso.");
            this.inventarioPCs = this.inventarioPCs.filter(p => p.id !== id);
        },

        guardarPrecios() { 
            alert("Precios actualizados en la memoria de la sesión."); 
        },
        
        agregarCuenta() { 
            this.cuentasEncargados.push({ 
                id: 'ENC-' + Date.now().toString().slice(-4), 
                ...this.nuevaCuenta 
            }); 
            this.nuevaCuenta = { nombre: '', correo: '', pass: '' };
            alert("Encargado registrado en memoria.");
        },

        eliminarCuenta(id, nombre) { 
            if (confirm(`¿Eliminar encargado ${nombre}?`)) {
                this.cuentasEncargados = this.cuentasEncargados.filter(c => c.id !== id); 
            }
        },

        abrirModalCuenta(cuenta) { 
            this.modal.cuenta.data = { ...cuenta }; 
            this.modal.cuenta.abierto = true; 
        },

        guardarEdicionCuenta() { 
            const idx = this.cuentasEncargados.findIndex(c => c.id === this.modal.cuenta.data.id);
            if (idx !== -1) {
                this.cuentasEncargados[idx] = { ...this.modal.cuenta.data };
                this.modal.cuenta.abierto = false; 
            }
        },
        
        agregarGato() { 
            const nuevoId = this.inventarioGatos.length > 0 
                ? Math.max(...this.inventarioGatos.map(g => parseInt(g.id) || 0)) + 1 
                : 1;
            this.inventarioGatos.push({ 
                id: nuevoId, 
                ...this.nuevoGato, 
                llego: 'Sí', 
                estado: 'Disponible', 
                horario: '10:00 - 18:00', 
                asignacion: 'Ninguna' 
            }); 
            this.nuevoGato = { nombre: '', tipo: '' }; 
            alert("Acompañante registrado en memoria.");
        },

        eliminarGato(id, nombre) { 
            if (confirm(`¿Eliminar a ${nombre}?`)) {
                this.inventarioGatos = this.inventarioGatos.filter(g => g.id !== id); 
            }
        },

        abrirModalGato(gato) { 
            this.modal.gato.data = { ...gato }; 
            this.modal.gato.abierto = true; 
        },

        guardarEdicionGato() { 
            const idx = this.inventarioGatos.findIndex(g => g.id === this.modal.gato.data.id);
            if (idx !== -1) {
                this.inventarioGatos[idx] = { ...this.modal.gato.data };
            }
            this.modal.gato.abierto = false; 
        }
    }));
});