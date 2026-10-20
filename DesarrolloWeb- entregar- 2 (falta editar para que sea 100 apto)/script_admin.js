document.addEventListener('alpine:init', () => {
    Alpine.data('adminApp', () => ({
        vista: 'menu',
        tituloRuta: '',
        menuPerfil: false,
        modalPerfil: false,
        cargando: true,
        errorCarga: '',
        inicialPerfil: 'A',
        datosPerfil: { id: '', nombre: '', correo: '', rol: 'Administrador' },
        
        busquedaPC: '',
        busquedaCuenta: '', 

        inventarioPCs: [],
        precios: { horaBase: 2500, horaExtra: 1000, gatoBase: 0, gatoExtra: 1500, bebida: 1200, snack: 800, imprimir: 150 },
        
        listaAdmins: [],
        cuentasEncargados: [],
        inventarioGatos: [],
        
        nuevoPC: { id: '', estado: 'Disponible' },
        nuevaCuenta: { nombre: '', correo: '', pass: '' },
        nuevoGato: { nombre: '', tipo: '' },
        modal: { cuenta: { abierto: false, data: {} }, gato: { abierto: false, data: {} } },

        async init() {
            const params = new URLSearchParams(window.location.search);
            const correoURL = params.get('correo') || 'admin@mail.com';
            this.inicialPerfil = correoURL.charAt(0).toUpperCase();
            this.datosPerfil.correo = correoURL;
            this.datosPerfil.id = 'ADM-' + Math.floor(Math.random() * 10000);

            try {
                // AQUÍ ESTABA EL ERROR: Faltaba leer el Json_acompañantes.json
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
                if (resGatos.ok) this.inventarioGatos = await resGatos.json(); // Ahora sí lee los gatos
                
            } catch (e) {
                console.error("Cargando desde memoria (JSON no disponibles).", e);
                this.errorCarga = "Error al leer archivos JSON.";
            }
            this.cargando = false; // Oculta el mensaje de carga
        },

        get todasLasCuentas() {
            let admins = this.listaAdmins.map(a => ({ ...a, rol: 'Administrador' }));
            let encargados = this.cuentasEncargados.map(e => ({ ...e, rol: 'Encargado' }));
            let combinadas = [...admins, ...encargados];
            
            const q = this.busquedaCuenta.trim().toLowerCase();
            if (!q) return combinadas;
            return combinadas.filter(c => c.nombre.toLowerCase().includes(q) || c.correo.toLowerCase().includes(q));
        },

        get pcsFiltrados() {
            const q = this.busquedaPC.trim().toLowerCase();
            if (!q) return this.inventarioPCs;
            return this.inventarioPCs.filter(pc => pc.id.toLowerCase().includes(q) || pc.estado.toLowerCase().includes(q));
        },

        abrirSeccion(id, nombre) { this.vista = id; this.tituloRuta = ` : ${nombre}`; },
        volverAlMenu() { this.vista = 'menu'; this.tituloRuta = ''; },
        cerrarSesion() { window.location.href = 'index.html'; },
        irConfiguraciones() { this.menuPerfil = false; this.modalPerfil = true; },

        agregarPC() {
            if (this.inventarioPCs.find(pc => pc.id.toLowerCase() === this.nuevoPC.id.toLowerCase())) return alert("Ya existe.");
            this.inventarioPCs.push({ id: this.nuevoPC.id, estado: this.nuevoPC.estado });
            this.nuevoPC = { id: '', estado: 'Disponible' };
        },
        cambiarEstadoPC(id) {
            const pc = this.inventarioPCs.find(p => p.id === id);
            if (pc.estado === 'Ocupado') return alert("PC en uso.");
            pc.estado = pc.estado === 'Disponible' ? 'Mantenimiento' : 'Disponible';
        },
        eliminarPC(id) {
            const pc = this.inventarioPCs.find(p => p.id === id);
            if (pc.estado === 'Ocupado') return alert("PC en uso.");
            this.inventarioPCs = this.inventarioPCs.filter(p => p.id !== id);
        },
        guardarPrecios() { alert("Precios actualizados en memoria."); },
        
        agregarCuenta() { 
            this.cuentasEncargados.push({ id: 'ENC-' + Date.now().toString().slice(-4), ...this.nuevaCuenta }); 
            this.nuevaCuenta = { nombre: '', correo: '', pass: '' }; 
        },
        eliminarCuenta(id, nombre) { 
            if(confirm(`Eliminar encargado ${nombre}?`)) this.cuentasEncargados = this.cuentasEncargados.filter(c => c.id !== id); 
        },
        abrirModalCuenta(cuenta) { this.modal.cuenta.data = { ...cuenta }; this.modal.cuenta.abierto = true; },
        guardarEdicionCuenta() { 
            const idx = this.cuentasEncargados.findIndex(c => c.id === this.modal.cuenta.data.id);
            if(idx !== -1) {
                this.cuentasEncargados[idx] = { ...this.modal.cuenta.data };
                this.modal.cuenta.abierto = false; 
            }
        },
        
        agregarGato() { this.inventarioGatos.push({ id: Date.now(), ...this.nuevoGato, llego: 'Sí', estado: 'Disponible', horario: '09:00 - 15:00', asignacion: 'Ninguna' }); this.nuevoGato = { nombre: '', tipo: '' }; },
        eliminarGato(id, nombre) { if(confirm(`Eliminar ${nombre}?`)) this.inventarioGatos = this.inventarioGatos.filter(g => g.id !== id); },
        abrirModalGato(gato) { this.modal.gato.data = { ...gato }; this.modal.gato.abierto = true; },
        guardarEdicionGato() { this.modal.gato.abierto = false; }
    }));
});