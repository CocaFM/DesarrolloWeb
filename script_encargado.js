/* ========================================================================== */
/* COMPONENTE ALPINE: encargadoApp (Lógica Operativa del Encargado de Turno)  */
/* ========================================================================== */
document.addEventListener('alpine:init', () => {
    Alpine.data('encargadoApp', () => ({
        
        // ==================================================================
        // 1. VARIABLES DE INTERFAZ Y ESTADO DEL PERFIL
        // ==================================================================
        vista: 'menu',
        mostrarAyuda: false,
        tituloRuta: '',
        menuPerfil: false,
        modalPerfil: false,
        inicialPerfil: 'E',
        datosPerfil: { id: '', nombre: '', correo: '', rol: 'Encargado de Turno' },
        cargando: true, 
        errorCarga: '',
        tiempoActualizador: Date.now(),
        
        // ==================================================================
        // 2. LISTAS EN MEMORIA Y MODELOS DE FORMULARIO
        // ==================================================================
        registroClientes: [], 
        estadoGatos: [], 
        estadoPCs: [], 
        agenda: [],
        historialCierres: [],
        precios: { horaBase: 2500, gatoBase: 0, gatoExtra: 1500, bebida: 1200, snack: 800, imprimir: 150 },

        nuevoCli: { nombre: '', pc: '', horas: 1, gato: '' },
        modSesion: { pc: '', gatoCambio: '' },
        reservaManual: { nombre: '', fecha: '', horas: 1, gato: '' },
        modalHorario: { abierto: false, id: null, entrada: '', salida: '' },

        // ==================================================================
        // 3. INICIALIZACIÓN Y LECTURA DE LOS 6 JSON VINCULADOS CON FETCH()
        // ==================================================================
        async init() {
            const params = new URLSearchParams(window.location.search);
            const nombreURL = params.get('nombre') || params.get('correo') || 'Encargado';
            const correoURL = params.get('correo') || 'encargado@mail.com';
            
            this.inicialPerfil = nombreURL.trim().charAt(0).toUpperCase();
            this.datosPerfil.correo = correoURL;
            this.datosPerfil.nombre = nombreURL;
            this.datosPerfil.id = 'ENC-' + Math.floor(Math.random() * 10000);

            try {
                const [resGatos, resPCs, resPrecios, resReservas, resCierres, resEnc] = await Promise.all([
                    fetch('Json_acompañantes.json'),
                    fetch('Json_pcs.json'),
                    fetch('Json_productos_precios.json'),
                    fetch('Json_reservas.json'),
                    fetch('Json_cierre_caja.json'),
                    fetch('Json_encargados.json')
                ]);

                if (resEnc.ok) {
                    const encargados = await resEnc.json();
                    const enc = encargados.find(e => e.correo.toLowerCase() === correoURL.toLowerCase());
                    if (enc && enc.nombre) {
                        this.inicialPerfil = enc.nombre.trim().charAt(0).toUpperCase();
                        this.datosPerfil.nombre = enc.nombre;
                        this.datosPerfil.id = enc.id || this.datosPerfil.id;
                    }
                }

                if (resGatos.ok) this.estadoGatos = await resGatos.json();
                if (resPCs.ok) this.estadoPCs = await resPCs.json();
                if (resPrecios.ok) {
                    const dataPrecios = await resPrecios.json();
                    this.precios = dataPrecios.tarifas || dataPrecios;
                }
                if (resReservas.ok) {
                    const dataReservas = await resReservas.json();
                    this.agenda = dataReservas.map(r => ({ ...r, pcElegido: '', gatoElegido: r.gato || '' }));
                }
                if (resCierres.ok) {
                    this.historialCierres = await resCierres.json();
                }

            } catch (e) {
                console.warn("Fallo lectura desde JSON. Usando memoria temporal.", e);
                this.errorCarga = "Error al leer los archivos JSON.";
            } finally {
                this.cargando = false;
            }
            
            setInterval(() => { this.tiempoActualizador = Date.now(); }, 1000);
        },

        // ==================================================================
        // 4. NAVEGACIÓN INTERNA Y PROPIEDADES COMPUTADAS
        // ==================================================================
        abrirSeccion(id, nombre) { this.vista = id; this.tituloRuta = ` : ${nombre}`; },
        volverAlMenu() { this.vista = 'menu'; this.tituloRuta = ''; },
        cerrarSesion() { window.location.href = 'index.html'; },
        irConfiguraciones() { this.menuPerfil = false; this.modalPerfil = true; },

        get pcsDisponibles() { return this.estadoPCs.filter(pc => pc.estado === 'Disponible'); },
        get pcsOcupados() { return this.estadoPCs.filter(pc => pc.estado === 'Ocupado'); },
        get gatosDisponibles() { return this.estadoGatos.filter(g => g.estado === 'Disponible'); },
        get reservasPendientes() { return this.agenda.filter(r => r.estado === 'Pendiente'); },
        get montoCalculadoCli() { return (parseInt(this.nuevoCli.horas) || 0) * this.precios.horaBase + (this.nuevoCli.gato !== "" ? this.precios.gatoBase : 0); },
        get montoReservaManual() { return (parseInt(this.reservaManual.horas) || 0) * this.precios.horaBase; },
        get totalClientes() { return this.registroClientes.length; },
        get ingresosTotales() { return this.registroClientes.reduce((suma, c) => suma + c.monto, 0); },

        // ==================================================================
        // 5. REGISTRO Y TERMINACIÓN DE SESIONES DE CLIENTES EN PC
        // ==================================================================
        guardarClienteTemporal() {
            if (!this.nuevoCli.pc) return alert("Asigna un PC disponible.");
            const pcIndex = this.estadoPCs.findIndex(p => p.id === this.nuevoCli.pc);
            if (pcIndex !== -1) {
                this.estadoPCs[pcIndex].estado = 'Ocupado'; 
                this.estadoPCs[pcIndex].cliente = this.nuevoCli.nombre;
                this.estadoPCs[pcIndex].gato = this.nuevoCli.gato || 'Sin acompañante';
                this.estadoPCs[pcIndex].horaInicioStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            if (this.nuevoCli.gato) {
                const gatoIndex = this.estadoGatos.findIndex(g => g.nombre === this.nuevoCli.gato);
                if (gatoIndex !== -1) { 
                    this.estadoGatos[gatoIndex].estado = 'Ocupado'; 
                    this.estadoGatos[gatoIndex].asignacion = `Cliente: ${this.nuevoCli.nombre}`; 
                }
            }
            this.registroClientes.push({ 
                id: Date.now(), 
                nombre: this.nuevoCli.nombre, 
                pc: this.nuevoCli.pc, 
                gato: this.nuevoCli.gato || 'Sin acompañante', 
                horas: this.nuevoCli.horas, 
                monto: this.montoCalculadoCli, 
                activo: true 
            });
            alert("Sesión registrada en memoria temporal.");
            this.nuevoCli = { nombre: '', pc: '', horas: 1, gato: '' };
        },

        terminarSesion(pcId, gatoAsignado) {
            const pc = this.estadoPCs.find(p => p.id === pcId);
            const cli = this.registroClientes.find(c => c.pc === pcId && c.activo);
            if (cli) cli.activo = false; 
            if (gatoAsignado && gatoAsignado !== 'Sin acompañante') {
                const gato = this.estadoGatos.find(est => est.nombre === gatoAsignado);
                if (gato) { gato.estado = 'Disponible'; gato.asignacion = 'Ninguna'; }
            }
            pc.estado = 'Disponible'; 
            delete pc.cliente; 
            delete pc.gato;
        },

        // ==================================================================
        // 6. ASISTENCIA Y HORARIOS DE ACOMPAÑANTES (10:00 A 02:00 HRS)
        // ==================================================================
        alternarLlegada(idGato) {
            const gato = this.estadoGatos.find(g => g.id === idGato);
            if (gato.estado === 'Ocupado') return alert("No puedes ausentar a un gato asignado a un cliente.");
            gato.llego = gato.llego === 'Sí' ? 'No' : 'Sí'; 
            gato.estado = gato.llego === 'Sí' ? 'Disponible' : 'No disponible';
        },

        abrirModalHorario(gato) {
            let partes = gato.horario.split(' - ');
            this.modalHorario = { abierto: true, id: gato.id, entrada: partes[0].trim(), salida: partes[1] ? partes[1].trim() : '' };
        },

        guardarHorario() {
            let gato = this.estadoGatos.find(g => g.id === this.modalHorario.id);
            if (!gato) return;

            const checkTime = (timeStr) => {
                if (!timeStr) return false;
                let h = parseInt(timeStr.split(':')[0]);
                return (h >= 10 && h <= 23) || (h >= 0 && h <= 2);
            };

            if (!checkTime(this.modalHorario.entrada) || !checkTime(this.modalHorario.salida)) {
                return alert("Horario inválido. El cibercafé solo opera de 10:00 a 02:00 hrs.");
            }

            gato.horario = `${this.modalHorario.entrada} - ${this.modalHorario.salida}`;
            this.modalHorario.abierto = false;
        },

        // ==================================================================
        // 7. MODIFICACIÓN DE SESIÓN, RESERVAS Y CIERRE DE CAJA
        // ==================================================================
        guardarExtra() {
            if (!this.modSesion.pc) return alert("Selecciona un PC.");
            let pc = this.estadoPCs.find(p => p.id === this.modSesion.pc);
            if (this.modSesion.gatoCambio) {
                if (pc.gato && pc.gato !== 'Sin acompañante') {
                    let gPrev = this.estadoGatos.find(g => g.nombre === pc.gato);
                    if (gPrev) { gPrev.estado = 'Disponible'; gPrev.asignacion = 'Ninguna'; }
                }
                if (this.modSesion.gatoCambio !== 'QUITAR') {
                    let gNuevo = this.estadoGatos.find(g => g.nombre === this.modSesion.gatoCambio);
                    if (gNuevo) { gNuevo.estado = 'Ocupado'; gNuevo.asignacion = `Cliente: ${pc.cliente}`; }
                    pc.gato = this.modSesion.gatoCambio;
                } else { 
                    pc.gato = 'Sin acompañante'; 
                }
            }
            alert("Cambio aplicado en memoria.");
            this.modSesion = { pc: '', gatoCambio: '' };
        },

        guardarReserva() {
            this.agenda.push({ 
                id: Date.now(), 
                nombre: this.reservaManual.nombre, 
                fecha: this.reservaManual.fecha, 
                horas: this.reservaManual.horas, 
                monto: this.montoReservaManual, 
                estado: 'Pendiente' 
            });
            alert("Reserva guardada en memoria.");
            this.reservaManual = { nombre: '', fecha: '', horas: 1, gato: '' };
        },

        cancelarReserva(id) { 
            let r = this.agenda.find(x => x.id === id); 
            if (r) r.estado = 'Cancelada'; 
        },

        finalizarCierreCaja() {
            if (this.estadoPCs.some(pc => pc.estado === 'Ocupado')) {
                return alert("⚠️ ¡Acción denegada! Hay sesiones de PC activas en este momento. Debes terminar todas las sesiones antes de cerrar la caja.");
            }
            if (this.totalClientes === 0) {
                return alert("No hay registros de clientes en este turno para realizar el cierre de caja.");
            }
            
            if (confirm(`¿Confirmas el cierre de caja por un total de $${this.ingresosTotales.toLocaleString()} con ${this.totalClientes} clientes atendidos?`)) {
                this.historialCierres.push({
                    id: Date.now(),
                    fecha: new Date().toLocaleString(),
                    correo: this.datosPerfil.correo,
                    clientes: this.totalClientes,
                    total: this.ingresosTotales
                });

                this.registroClientes = [];
                alert("Caja cerrada exitosamente. Los datos se han añadido al historial en memoria.");
                this.volverAlMenu();
            }
        }
    }));
});