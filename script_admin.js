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
        // 3. INICIALIZACIÓN Y CARGA DE DATOS (API Atlas con fallback a JSON)
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
                // Intenta primero cargar desde la API (Atlas); si falla, usa los JSON estáticos
                const fetchWithFallback = async (apiUrl, jsonUrl) => {
                    try {
                        const res = await fetch(apiUrl);
                        if (res.ok) return await res.json();
                    } catch (e) {}
                    const resJson = await fetch(jsonUrl);
                    return await resJson.json();
                };

                const [dataPCs, dataPrecios, dataAdmins, dataEncargados, dataGatos] = await Promise.all([
                    fetchWithFallback('/api/pcs', 'Json_pcs.json'),
                    fetchWithFallback('/api/precios', 'Json_productos_precios.json'),
                    fetchWithFallback('/api/usuarios', 'Json_administradores.json'),
                    fetchWithFallback('/api/encargados', 'Json_encargados.json'),
                    fetchWithFallback('/api/gatos', 'Json_acompañantes.json')
                ]);

                if (dataPCs) this.inventarioPCs = Array.isArray(dataPCs) ? dataPCs : [];
                if (dataPrecios) this.precios = dataPrecios.tarifas || dataPrecios;
                if (dataAdmins) {
                    this.listaAdmins = Array.isArray(dataAdmins) ? dataAdmins.filter(u => u.rol === 'admin' || !u.rol) : [];
                    const adm = this.listaAdmins.find(a => (a.correo || a.usuario || '').toLowerCase() === correoURL.toLowerCase());
                    if (adm && adm.nombre) {
                        this.inicialPerfil = adm.nombre.trim().charAt(0).toUpperCase();
                        this.datosPerfil.nombre = adm.nombre;
                        this.datosPerfil.id = adm.id || this.datosPerfil.id;
                    }
                }
                if (dataEncargados) this.cuentasEncargados = Array.isArray(dataEncargados) ? dataEncargados : [];
                if (dataGatos) this.inventarioGatos = Array.isArray(dataGatos) ? dataGatos : [];

            } catch (e) {
                console.error("Error leyendo datos en Admin:", e);
                this.errorCarga = "Error al cargar datos. Verifica la conexión con el servidor.";
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
                (c.correo && c.correo.toLowerCase().includes(q)) ||
                (c.usuario && c.usuario.toLowerCase().includes(q))
            );
        },

        get pcsFiltrados() {
            const q = this.busquedaPC.trim().toLowerCase();
            if (!q) return this.inventarioPCs;
            return this.inventarioPCs.filter(pc => 
                (pc.id && pc.id.toLowerCase().includes(q)) || 
                (pc.estado && pc.estado.toLowerCase().includes(q))
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
        // 6. FUNCIONES CRUD CONECTADAS A LA API / ATLAS
        // ==================================================================
        
        // --- 1. Gestión de PCs ---
        async agregarPC() {
            if (!this.nuevoPC.id.trim()) {
                alert("Por favor ingresa un identificador para el equipo (ej: PC 13).");
                return;
            }

            const idNuevo = this.nuevoPC.id.trim();
            const estadoNuevo = this.nuevoPC.estado;

            try {
                const respuesta = await fetch('/api/pcs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: idNuevo, estado: estadoNuevo, categoria: 'Estándar' })
                });

                const data = await respuesta.json();

                if (respuesta.ok) {
                    alert("PC agregado correctamente a MongoDB Atlas.");
                } else {
                    alert(data.mensaje || "Error al agregar PC.");
                }
            } catch (error) {
                alert("Aviso: Guardado localmente (servidor no disponible).");
            }

            // Actualización reactiva instantánea en la interfaz
            this.inventarioPCs.push({ id: idNuevo, estado: estadoNuevo, categoria: 'Estándar' });
            this.nuevoPC = { id: '', estado: 'Disponible' };
        },

        async cambiarEstadoPC(idPC) {
            const index = this.inventarioPCs.findIndex(p => p.id === idPC);
            if (index === -1) return;

            const estadoAnterior = this.inventarioPCs[index].estado;
            const nuevoEstado = estadoAnterior === 'Disponible' ? 'Mantenimiento' : 'Disponible';

            try {
                const respuesta = await fetch(`/api/pcs/${encodeURIComponent(idPC)}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estado: nuevoEstado })
                });

                if (!respuesta.ok) {
                    console.warn("No se pudo actualizar en el backend, cambiando localmente.");
                }
            } catch (error) {
                console.warn("Error de conexión al actualizar estado del PC.");
            }

            // Actualizar vista reactiva
            this.inventarioPCs[index].estado = nuevoEstado;
        },

        async eliminarPC(idPC) {
            if (!confirm(`¿Estás completamente seguro de que deseas eliminar el equipo ${idPC}?`)) {
                return;
            }

            try {
                const respuesta = await fetch(`/api/pcs/${encodeURIComponent(idPC)}`, {
                    method: 'DELETE'
                });

                if (respuesta.ok) {
                    alert("Equipo eliminado de la base de datos.");
                }
            } catch (error) {
                console.warn("Error de conexión al eliminar PC, eliminando de la vista.");
            }

            this.inventarioPCs = this.inventarioPCs.filter(p => p.id !== idPC);
        },

        // --- 2. Gestión de Precios ---
        async guardarPrecios() {
            try {
                const respuesta = await fetch('/api/precios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.precios)
                });
                
                if (respuesta.ok) {
                    alert("Los precios se han actualizado correctamente en MongoDB Atlas.");
                } else {
                    alert("Precios actualizados localmente.");
                }
            } catch (error) {
                alert("Precios guardados localmente (servidor no disponible).");
            }
        },

        // --- 3. Gestión de Cuentas / Encargados ---
        async agregarCuenta() {
            if (!this.nuevaCuenta.nombre || !this.nuevaCuenta.correo || !this.nuevaCuenta.pass) {
                alert("Completa todos los campos obligatorios.");
                return;
            }

            const nueva = {
                id: `ENC-${Date.now().toString().slice(-3)}`,
                nombre: this.nuevaCuenta.nombre.trim(),
                correo: this.nuevaCuenta.correo.trim().toLowerCase(),
                pass: this.nuevaCuenta.pass.trim(),
                turno: 'Por definir'
            };

            try {
                const respuesta = await fetch('/api/encargados', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(nueva)
                });
                
                if (respuesta.ok) {
                    alert("Encargado registrado en MongoDB Atlas.");
                } else {
                    const data = await respuesta.json();
                    alert(data.mensaje || "Encargado agregado a la lista.");
                }
            } catch (error) {
                alert("Encargado guardado localmente (servidor no disponible).");
            }

            this.cuentasEncargados.push(nueva);
            this.nuevaCuenta = { nombre: '', correo: '', pass: '' };
        },

        async eliminarCuenta(idCuenta, nombreCuenta) {
            if (!confirm(`¿Estás completamente seguro de que deseas eliminar la cuenta de "${nombreCuenta}"?`)) {
                return;
            }

            try {
                const respuesta = await fetch(`/api/encargados/${encodeURIComponent(idCuenta)}`, {
                    method: 'DELETE'
                });

                if (respuesta.ok) {
                    alert("Cuenta eliminada correctamente de la base de datos.");
                }
            } catch (error) {
                console.warn("Error de conexión al eliminar cuenta.");
            }

            this.cuentasEncargados = this.cuentasEncargados.filter(c => c.id !== idCuenta);
            this.listaAdmins = this.listaAdmins.filter(c => c.id !== idCuenta);
        },

        abrirModalCuenta(cuenta) { 
            this.modal.cuenta.data = { ...cuenta }; 
            this.modal.cuenta.abierto = true; 
        },

        async guardarEdicionCuenta() {
            const idCuenta = this.modal.cuenta.data.id;
            const nombreMod = this.modal.cuenta.data.nombre;
            const correoMod = this.modal.cuenta.data.correo;
            const passMod = this.modal.cuenta.data.pass;

            try {
                const respuesta = await fetch(`/api/encargados/${encodeURIComponent(idCuenta)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre: nombreMod, correo: correoMod, pass: passMod })
                });

                if (respuesta.ok) {
                    alert("Cuenta modificada exitosamente en MongoDB Atlas.");
                }
            } catch (error) {
                console.warn("Error al conectar con la API, actualizando vista.");
            }

            // Actualizar vista localmente
            const idxEnc = this.cuentasEncargados.findIndex(c => c.id === idCuenta);
            if (idxEnc !== -1) {
                this.cuentasEncargados[idxEnc].nombre = nombreMod;
                this.cuentasEncargados[idxEnc].correo = correoMod;
                this.cuentasEncargados[idxEnc].pass = passMod;
            }
            const idxAdm = this.listaAdmins.findIndex(c => c.id === idCuenta);
            if (idxAdm !== -1) {
                this.listaAdmins[idxAdm].nombre = nombreMod;
                this.listaAdmins[idxAdm].correo = correoMod;
                this.listaAdmins[idxAdm].pass = passMod;
            }
            
            this.modal.cuenta.abierto = false;
        },
        
        // --- 4. Gestión de Gatos Acompañantes ---
        async agregarGato() {
            if (!this.nuevoGato.nombre.trim() || !this.nuevoGato.tipo.trim()) {
                alert("Completa el nombre y la raza/tipo del acompañante.");
                return;
            }

            const nuevo = {
                id: `CAT-${Date.now().toString().slice(-4)}`,
                nombre: this.nuevoGato.nombre.trim(),
                tipo: this.nuevoGato.tipo.trim(),
                llego: 'Sí',
                horario: '10:00 - 18:00',
                estado: 'Disponible',
                asignacion: 'Ninguna'
            };

            try {
                const respuesta = await fetch('/api/gatos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(nuevo)
                });

                if (respuesta.ok) {
                    alert("Acompañante registrado exitosamente en MongoDB Atlas.");
                }
            } catch (error) {
                alert("Acompañante agregado localmente.");
            }

            this.inventarioGatos.push(nuevo);
            this.nuevoGato = { nombre: '', tipo: '' };
        },

        async eliminarGato(idGato, nombreGato) {
            if (!confirm(`¿Estás seguro de que deseas dar de baja al acompañante "${nombreGato}"?`)) {
                return;
            }

            try {
                const respuesta = await fetch(`/api/gatos/${encodeURIComponent(idGato)}`, {
                    method: 'DELETE'
                });

                if (respuesta.ok) {
                    alert("Acompañante eliminado de la base de datos.");
                }
            } catch (error) {
                console.warn("Error al eliminar acompañante del backend.");
            }

            this.inventarioGatos = this.inventarioGatos.filter(g => g.id !== idGato);
        },

        abrirModalGato(gato) { 
            this.modal.gato.data = { ...gato }; 
            this.modal.gato.abierto = true; 
        },

        async guardarEdicionGato() {
            const idGato = this.modal.gato.data.id;
            const nombreMod = this.modal.gato.data.nombre;
            const tipoMod = this.modal.gato.data.tipo;

            try {
                const respuesta = await fetch(`/api/gatos/${encodeURIComponent(idGato)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre: nombreMod, tipo: tipoMod })
                });

                if (respuesta.ok) {
                    alert("Datos del acompañante modificados exitosamente.");
                }
            } catch (error) {
                console.warn("Error de conexión al modificar gato.");
            }

            const idx = this.inventarioGatos.findIndex(g => g.id === idGato);
            if (idx !== -1) {
                this.inventarioGatos[idx].nombre = nombreMod;
                this.inventarioGatos[idx].tipo = tipoMod;
            }
            
            this.modal.gato.abierto = false;
        }
    }));
});
