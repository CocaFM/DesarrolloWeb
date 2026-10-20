document.addEventListener('alpine:init', () => {
    Alpine.data('clienteApp', () => ({
        vista: 'menu',
        tituloRuta: '',
        menuPerfil: false,
        modalPerfil: false,
        inicialPerfil: 'C',
        datosPerfil: { id: '', nombre: '', correo: '', rol: 'Cliente Registrado' },
        cargando: true,
        
        listaGatos: [],
        reservasEnMemoria: [],
        precios: { horaBase: 2500, gatoBase: 0 },

        reserva: { nombre: '', fecha: '', horas: 1, gato: '' },

        async init() {
            const params = new URLSearchParams(window.location.search);
            const nombreURL = params.get('nombre') || params.get('correo') || 'Cliente';
            const correoURL = params.get('correo') || 'cliente@mail.com';
            
            this.inicialPerfil = nombreURL.charAt(0).toUpperCase();

            this.datosPerfil.correo = correoURL;
            this.datosPerfil.id = 'CLI-' + Math.floor(Math.random() * 10000);

            try {
                const [resGatos, resPrecios, resCli] = await Promise.all([
                    fetch('Json_acompañantes.json'),
                    fetch('Json_productos_precios.json'),
                    fetch('Json_clientes.json')
                ]);

                if (resGatos.ok) this.listaGatos = await resGatos.json();
                if (resPrecios.ok) {
                    const dataPrecios = await resPrecios.json();
                    this.precios = dataPrecios.tarifas || dataPrecios;
                }
                if (resCli.ok) {
                    const clientes = await resCli.json();
                    const cli = clientes.find(c => c.correo.toLowerCase() === correoURL.toLowerCase());
                    if (cli && cli.nombre) {
                        this.inicialPerfil = cli.nombre.trim().charAt(0).toUpperCase();
                        this.datosPerfil.nombre = cli.nombre;
                    }
                }
            } catch (e) {
                console.error("Error al cargar JSON", e);
            } finally {
                this.cargando = false;
            }
        },

        get gatosDisponibles() { return this.listaGatos.filter(g => g.estado === 'Disponible'); },

        get montoEstimado() {
            let total = (parseInt(this.reserva.horas) || 0) * (this.precios.horaBase || 2500);
            if (this.reserva.gato !== '') total += (this.precios.gatoBase || 0);
            return total > 0 ? total : '';
        },

        abrirSeccion(id, nombre) { this.vista = id; this.tituloRuta = ` : ${nombre}`; },
        volverAlMenu() { this.vista = 'menu'; this.tituloRuta = ''; this.reserva = { nombre: '', fecha: '', horas: 1, gato: '' }; },
        cerrarSesion() { window.location.href = 'index.html'; },
        irConfiguraciones() { this.menuPerfil = false; this.modalPerfil = true; },

        confirmarReserva() {
            this.reservasEnMemoria.push({
                id: Date.now(), nombre: this.reserva.nombre, fecha: this.reserva.fecha,
                horas: this.reserva.horas, monto: this.montoEstimado, gato: this.reserva.gato
            });
            
            alert(`✅ Reserva agendada en memoria.`);
            this.volverAlMenu();
        }
    }));
});