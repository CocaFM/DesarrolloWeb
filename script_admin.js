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
        // 1. Agregar un nuevo PC
        async agregarPC() {
            try {
                const respuesta = await fetch('/api/pcs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: this.nuevoPC.id,
                        estado: this.nuevoPC.estado
                    })
                });

                const data = await respuesta.json();

                if (respuesta.ok) {
                    alert("PC agregado correctamente a MongoDB Atlas.");
                    this.nuevoPC = { id: '', estado: 'Disponible' }; // Limpia el formulario
                    // Aquí puedes llamar a tu función para recargar la tabla, por ejemplo:
                    // this.cargarDatos(); 
                } else {
                    alert(data.mensaje || "Error al agregar PC.");
                }
            } catch (error) {
                alert("Error de conexión con el servidor.");
            }
        },

        // 2. Alternar el estado del PC
        async cambiarEstadoPC(idPC) {
            try {
                const respuesta = await fetch(`/api/pcs/${idPC}`, {
                    method: 'PATCH'
                });

                if (respuesta.ok) {
                    // Encuentra el PC localmente y actualiza la vista al instante para no recargar toda la tabla
                    const pcIndex = this.pcsFiltrados.findIndex(p => p.id === idPC);
                    if (pcIndex !== -1) {
                        this.pcsFiltrados[pcIndex].estado = this.pcsFiltrados[pcIndex].estado === 'Disponible' ? 'Mantenimiento' : 'Disponible';
                    }
                } else {
                    alert("No se pudo cambiar el estado.");
                }
            } catch (error) {
                alert("Error de conexión al intentar cambiar el estado.");
            }
        },

        // 3. Eliminar el PC
        async eliminarPC(idPC) {
            if (!confirm(`¿Estás completamente seguro de que deseas eliminar el equipo ${idPC}?`)) {
                return;
            }

            try {
                const respuesta = await fetch(`/api/pcs/${idPC}`, {
                    method: 'DELETE'
                });

                if (respuesta.ok) {
                    alert("Equipo eliminado de la base de datos.");
                    // Actualiza la lista localmente para quitarlo de la tabla de inmediato
                    this.pcsFiltrados = this.pcsFiltrados.filter(p => p.id !== idPC);
                } else {
                    alert("No se pudo eliminar el equipo.");
                }
            } catch (error) {
                alert("Error de conexión al intentar eliminar el equipo.");
            }
        },
        // 1. Guardar Precios
        async guardarPrecios() {
            try {
                const respuesta = await fetch('/api/precios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.precios)
                });
                
                if (respuesta.ok) {
                    alert("Los precios se han actualizado correctamente en MongoDB Atlas.");
                }
            } catch (error) {
                alert("Error al conectar con la base de datos.");
            }
        },

        // 2. Agregar Encargado
        async agregarCuenta() {
            try {
                const respuesta = await fetch('/api/encargados', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.nuevaCuenta)
                });
                
                if (respuesta.ok) {
                    alert("Encargado registrado en la base de datos.");
                    // Aquí puedes llamar a una función que haga un fetch('GET', '/api/usuarios') para recargar la tabla
                    this.nuevaCuenta = { nombre: '', correo: '', pass: '' }; // Limpiar formulario
                }
            } catch (error) {
                alert("Error al registrar el encargado.");
            }
        },
        async eliminarCuenta(idCuenta, nombreCuenta) {
            // 1. Pedir confirmación al administrador usando el nombre del encargado
            if (!confirm(`¿Estás completamente seguro de que deseas eliminar la cuenta de "${nombreCuenta}"?`)) {
                return;
            }

            try {
                // 2. Enviar la petición DELETE al backend usando el ID en la URL
                const respuesta = await fetch(`/api/encargados/${idCuenta}`, {
                    method: 'DELETE'
                });

                if (respuesta.ok) {
                    alert("Cuenta eliminada correctamente de la base de datos.");
                    
                    // 3. Actualizar la tabla localmente para que el usuario desaparezca al instante
                    this.todasLasCuentas = this.todasLasCuentas.filter(cuenta => cuenta.id !== idCuenta);
                } else {
                    const data = await respuesta.json();
                    alert(data.mensaje || "No se pudo eliminar la cuenta.");
                }
            } catch (error) {
                alert("Error de conexión al intentar eliminar la cuenta.");
            }
        },
        abrirModalCuenta(cuenta) { 
            this.modal.cuenta.data = { ...cuenta }; 
            this.modal.cuenta.abierto = true; 
        },

        // Envía los datos editados a MongoDB Atlas al presionar "Guardar"
        async guardarEdicionCuenta() {
            try {
                const idCuenta = this.modal.cuenta.data.id;
                
                const respuesta = await fetch(`/api/encargados/${idCuenta}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: this.modal.cuenta.data.nombre,
                        correo: this.modal.cuenta.data.correo,
                        pass: this.modal.cuenta.data.pass
                    })
                });

                if (respuesta.ok) {
                    alert("Cuenta modificada exitosamente en la base de datos.");
                    
                    // Actualizar los datos visuales en la tabla local para reflejar los cambios
                    const index = this.todasLasCuentas.findIndex(c => c.id === idCuenta);
                    if (index !== -1) {
                        this.todasLasCuentas[index].nombre = this.modal.cuenta.data.nombre;
                        this.todasLasCuentas[index].correo = this.modal.cuenta.data.correo;
                        // Si la tabla mostrara la contraseña, también se actualizaría aquí
                    }
                    
                    // Cierra la ventana flotante
                    this.modal.cuenta.abierto = false;
                } else {
                    const data = await respuesta.json();
                    alert(data.mensaje || "Error al modificar la cuenta.");
                }
            } catch (error) {
                alert("Error de conexión al intentar modificar la cuenta.");
            }
        },
        
        async agregarGato() {
            try {
                const respuesta = await fetch('/api/gatos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: this.nuevoGato.nombre,
                        tipo: this.nuevoGato.tipo
                    })
                });

                if (respuesta.ok) {
                    alert("Acompañante registrado exitosamente en la base de datos.");
                    this.nuevoGato = { nombre: '', tipo: '' }; // Limpiar formulario
                    
                    // Si tienes una función para recargar la tabla, llámala aquí (ej: this.cargarGatos())
                    // De lo contrario, puedes hacer un window.location.reload() para ver los cambios.
                } else {
                    alert("Error al registrar el acompañante.");
                }
            } catch (error) {
                alert("Error de conexión con el servidor.");
            }
        },
        async eliminarGato(idGato, nombreGato) {
            if (!confirm(`¿Estás seguro de que deseas dar de baja al acompañante "${nombreGato}"?`)) {
                return;
            }

            try {
                const respuesta = await fetch(`/api/gatos/${idGato}`, {
                    method: 'DELETE'
                });

                if (respuesta.ok) {
                    alert("Acompañante eliminado de la base de datos.");
                    // Actualizar la lista localmente
                    this.inventarioGatos = this.inventarioGatos.filter(gato => gato.id !== idGato);
                } else {
                    alert("No se pudo eliminar al acompañante.");
                }
            } catch (error) {
                alert("Error de conexión al intentar eliminar.");
            }
        },

        abrirModalGato(gato) { 
            this.modal.gato.data = { ...gato }; 
            this.modal.gato.abierto = true; 
        },

        async guardarEdicionGato() {
            try {
                const idGato = this.modal.gato.data.id;
                
                const respuesta = await fetch(`/api/gatos/${idGato}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: this.modal.gato.data.nombre,
                        tipo: this.modal.gato.data.tipo
                    })
                });

                if (respuesta.ok) {
                    alert("Datos del acompañante modificados exitosamente.");
                    
                    // Actualizar la tabla localmente
                    const index = this.inventarioGatos.findIndex(g => g.id === idGato);
                    if (index !== -1) {
                        this.inventarioGatos[index].nombre = this.modal.gato.data.nombre;
                        this.inventarioGatos[index].tipo = this.modal.gato.data.tipo;
                    }
                    
                    this.modal.gato.abierto = false; // Cerrar el modal
                } else {
                    alert("Error al modificar el acompañante.");
                }
            } catch (error) {
                alert("Error de conexión al intentar modificar.");
            }
        },
    }));
});