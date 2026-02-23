// admin-app.js - Bennet Salon (VERSIÓN COMPLETA CON CALENDARIO VISUAL)

// ============================================
// FUNCIONES DE SUPABASE
// ============================================
async function getAllBookings() {
    const res = await fetch(
        `${window.SUPABASE_URL}/rest/v1/${window.TABLE_NAME || 'benettsalon'}?select=*&order=fecha.desc,hora_inicio.asc`,
        {
            headers: {
                'apikey': window.SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
            }
        }
    );
    return await res.json();
}

async function cancelBooking(id) {
    const res = await fetch(
        `${window.SUPABASE_URL}/rest/v1/${window.TABLE_NAME || 'benettsalon'}?id=eq.${id}`,
        {
            method: 'PATCH',
            headers: {
                'apikey': window.SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado: 'Cancelado' })
        }
    );
    return res.ok;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
function AdminApp() {
    // Estados principales
    const [bookings, setBookings] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [filterDate, setFilterDate] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('activas');
    
    // Detectar rol del usuario y nivel
    const [userRole, setUserRole] = React.useState('admin');
    const [userNivel, setUserNivel] = React.useState(3);
    const [trabajadora, setTrabajadora] = React.useState(null);
    
    // Pestaña activa
    const [tabActivo, setTabActivo] = React.useState('reservas');
    
    // Estados para clientes pendientes
    const [showClientesPendientes, setShowClientesPendientes] = React.useState(false);
    const [clientesPendientes, setClientesPendientes] = React.useState([]);
    const [showClientesAutorizados, setShowClientesAutorizados] = React.useState(false);
    const [clientesAutorizados, setClientesAutorizados] = React.useState([]);
    const [errorClientes, setErrorClientes] = React.useState('');
    const [cargandoClientes, setCargandoClientes] = React.useState(false);

    // ============================================
    // MODAL PARA CREAR RESERVA MANUAL
    // ============================================
    const [showNuevaReservaModal, setShowNuevaReservaModal] = React.useState(false);
    const [nuevaReservaData, setNuevaReservaData] = React.useState({
        cliente_nombre: '',
        cliente_whatsapp: '',
        servicio: '',
        trabajador_id: '',
        fecha: '',
        hora_inicio: ''
    });

    // Cargar servicios y trabajadoras para el modal
    const [serviciosList, setServiciosList] = React.useState([]);
    const [trabajadorasList, setTrabajadorasList] = React.useState([]);
    const [horariosDisponibles, setHorariosDisponibles] = React.useState([]);
    
    // Estados para el calendario
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [diasLaborales, setDiasLaborales] = React.useState([]);
    const [fechasConHorarios, setFechasConHorarios] = React.useState({});

    // ============================================
    // DETECTAR ROL Y NIVEL DEL USUARIO AL INICIAR
    // ============================================
    React.useEffect(() => {
        const trabajadoraAuth = window.getTrabajadoraAutenticada?.();
        if (trabajadoraAuth) {
            console.log('👤 Usuario detectado como trabajadora:', trabajadoraAuth);
            setUserRole('trabajadora');
            setTrabajadora(trabajadoraAuth);
            setUserNivel(trabajadoraAuth.nivel || 1);
            
            setNuevaReservaData(prev => ({
                ...prev,
                trabajador_id: trabajadoraAuth.id
            }));
        } else {
            console.log('👑 Usuario detectado como admin');
            setUserRole('admin');
            setUserNivel(3);
        }
    }, []);

    // Cargar datos para el modal
    React.useEffect(() => {
        const cargarDatosModal = async () => {
            if (window.salonServicios) {
                const servicios = await window.salonServicios.getAll(true);
                setServiciosList(servicios || []);
            }
            if (window.salonTrabajadoras) {
                const trabajadoras = await window.salonTrabajadoras.getAll(true);
                setTrabajadorasList(trabajadoras || []);
            }
        };
        cargarDatosModal();
    }, []);

    // Cargar días laborales cuando se selecciona trabajadora
    React.useEffect(() => {
        const cargarDiasLaborales = async () => {
            if (nuevaReservaData.trabajador_id) {
                try {
                    const horarios = await window.salonConfig.getHorariosTrabajadora(nuevaReservaData.trabajador_id);
                    setDiasLaborales(horarios.dias || []);
                    
                    // Cargar disponibilidad para el mes actual
                    await cargarDisponibilidadMes(currentDate, nuevaReservaData.trabajador_id);
                } catch (error) {
                    console.error('Error cargando días laborales:', error);
                    setDiasLaborales([]);
                }
            }
        };
        cargarDiasLaborales();
    }, [nuevaReservaData.trabajador_id]);

    // Función para cargar disponibilidad de un mes completo
    const cargarDisponibilidadMes = async (fecha, trabajadorId) => {
        if (!trabajadorId) return;
        
        try {
            const year = fecha.getFullYear();
            const month = fecha.getMonth();
            
            // Obtener horarios de la trabajadora
            const horarios = await window.salonConfig.getHorariosTrabajadora(trabajadorId);
            const horasTrabajo = horarios.horas || [];
            
            if (horasTrabajo.length === 0) {
                setFechasConHorarios({});
                return;
            }
            
            // Obtener todas las reservas del mes
            const primerDia = new Date(year, month, 1);
            const ultimoDia = new Date(year, month + 1, 0);
            
            const fechaInicio = primerDia.toISOString().split('T')[0];
            const fechaFin = ultimoDia.toISOString().split('T')[0];
            
            const response = await fetch(
                `${window.SUPABASE_URL}/rest/v1/${window.TABLE_NAME || 'benettsalon'}?fecha=gte.${fechaInicio}&fecha=lte.${fechaFin}&trabajador_id=eq.${trabajadorId}&estado=neq.Cancelado&select=fecha,hora_inicio,hora_fin`,
                {
                    headers: {
                        'apikey': window.SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
                    }
                }
            );
            
            const reservas = await response.json();
            
            // Agrupar reservas por fecha
            const reservasPorFecha = {};
            reservas.forEach(r => {
                if (!reservasPorFecha[r.fecha]) {
                    reservasPorFecha[r.fecha] = [];
                }
                reservasPorFecha[r.fecha].push(r);
            });
            
            // Determinar qué fechas tienen disponibilidad
            const disponibilidad = {};
            const diasEnMes = ultimoDia.getDate();
            
            for (let d = 1; d <= diasEnMes; d++) {
                const fechaStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
                const reservasDia = reservasPorFecha[fechaStr] || [];
                
                // Verificar si hay algún horario disponible
                const tieneDisponibilidad = horasTrabajo.some(hora => {
                    const slotStart = hora * 60;
                    const slotEnd = slotStart + 60; // Duración por defecto
                    
                    const tieneConflicto = reservasDia.some(reserva => {
                        const reservaStart = timeToMinutes(reserva.hora_inicio);
                        const reservaEnd = timeToMinutes(reserva.hora_fin);
                        return (slotStart < reservaEnd) && (slotEnd > reservaStart);
                    });
                    
                    return !tieneConflicto;
                });
                
                disponibilidad[fechaStr] = tieneDisponibilidad;
            }
            
            setFechasConHorarios(disponibilidad);
        } catch (error) {
            console.error('Error cargando disponibilidad:', error);
        }
    };

    // Función para cambiar de mes en el calendario
    const cambiarMes = (direccion) => {
        const nuevaFecha = new Date(currentDate);
        nuevaFecha.setMonth(currentDate.getMonth() + direccion);
        setCurrentDate(nuevaFecha);
        
        if (nuevaReservaData.trabajador_id) {
            cargarDisponibilidadMes(nuevaFecha, nuevaReservaData.trabajador_id);
        }
    };

    // Función para obtener los días del mes
    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const days = [];
        
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }
        
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }
        
        return days;
    };

    // Función para formatear fecha
    const formatDate = (date) => {
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    // Función para verificar si una fecha está disponible
    const isDateAvailable = (date) => {
        if (!date || !nuevaReservaData.trabajador_id) return false;
        
        const fechaStr = formatDate(date);
        const diaSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][date.getDay()];
        
        // Verificar si el día es laboral
        if (diasLaborales.length > 0 && !diasLaborales.includes(diaSemana)) {
            return false;
        }
        
        // Verificar si tiene horarios disponibles
        return fechasConHorarios[fechaStr] || false;
    };

    // Función para seleccionar fecha
    const handleDateSelect = (date) => {
        if (isDateAvailable(date)) {
            const fechaStr = formatDate(date);
            setNuevaReservaData({...nuevaReservaData, fecha: fechaStr, hora_inicio: ''});
        }
    };

    // Cargar horarios cuando se selecciona fecha
    React.useEffect(() => {
        const cargarHorarios = async () => {
            if (nuevaReservaData.trabajador_id && nuevaReservaData.fecha) {
                try {
                    const horarios = await window.salonConfig.getHorariosTrabajadora(nuevaReservaData.trabajador_id);
                    const bookings = await window.getBookingsByDateAndWorker(nuevaReservaData.fecha, nuevaReservaData.trabajador_id);
                    
                    const baseSlots = (horarios.horas || []).map(h => 
                        `${h.toString().padStart(2, '0')}:00`
                    );
                    
                    const servicioSeleccionado = serviciosList.find(s => s.nombre === nuevaReservaData.servicio);
                    const duracion = servicioSeleccionado?.duracion || 60;
                    
                    const available = baseSlots.filter(slotStartStr => {
                        const slotStart = timeToMinutes(slotStartStr);
                        const slotEnd = slotStart + duracion;
                        
                        const hasConflict = bookings.some(booking => {
                            const bookingStart = timeToMinutes(booking.hora_inicio);
                            const bookingEnd = timeToMinutes(booking.hora_fin);
                            return (slotStart < bookingEnd) && (slotEnd > bookingStart);
                        });
                        
                        return !hasConflict;
                    });
                    
                    setHorariosDisponibles(available);
                } catch (error) {
                    console.error('Error cargando horarios:', error);
                    setHorariosDisponibles([]);
                }
            } else {
                setHorariosDisponibles([]);
            }
        };
        cargarHorarios();
    }, [nuevaReservaData.trabajador_id, nuevaReservaData.fecha, nuevaReservaData.servicio]);

    const handleCrearReservaManual = async () => {
        if (!nuevaReservaData.cliente_nombre || !nuevaReservaData.cliente_whatsapp || 
            !nuevaReservaData.servicio || !nuevaReservaData.trabajador_id || 
            !nuevaReservaData.fecha || !nuevaReservaData.hora_inicio) {
            alert('Completá todos los campos');
            return;
        }

        try {
            const servicio = serviciosList.find(s => s.nombre === nuevaReservaData.servicio);
            const trabajadora = trabajadorasList.find(t => t.id === parseInt(nuevaReservaData.trabajador_id));
            
            const endTime = calculateEndTime(nuevaReservaData.hora_inicio, servicio.duracion);
            
            const bookingData = {
                cliente_nombre: nuevaReservaData.cliente_nombre,
                cliente_whatsapp: `53${nuevaReservaData.cliente_whatsapp.replace(/\D/g, '')}`,
                servicio: nuevaReservaData.servicio,
                duracion: servicio.duracion,
                trabajador_id: nuevaReservaData.trabajador_id,
                trabajador_nombre: trabajadora.nombre,
                fecha: nuevaReservaData.fecha,
                hora_inicio: nuevaReservaData.hora_inicio,
                hora_fin: endTime,
                estado: "Reservado"
            };

            console.log('📤 Creando reserva manual:', bookingData);
            const result = await createBooking(bookingData);
            
            if (result.success) {
                alert('✅ Reserva creada exitosamente');
                setShowNuevaReservaModal(false);
                setNuevaReservaData({
                    cliente_nombre: '',
                    cliente_whatsapp: '',
                    servicio: '',
                    trabajador_id: userRole === 'trabajadora' ? trabajadora?.id : '',
                    fecha: '',
                    hora_inicio: ''
                });
                fetchBookings();
            }
        } catch (error) {
            console.error('Error creando reserva:', error);
            alert('❌ Error al crear la reserva');
        }
    };

    // ============================================
    // FUNCIONES DE CLIENTES
    // ============================================
    
    const loadClientesPendientes = async () => {
        console.log('🔄 Cargando clientes pendientes...');
        setCargandoClientes(true);
        try {
            if (typeof window.getClientesPendientes !== 'function') {
                console.error('❌ getClientesPendientes no está definida');
                setErrorClientes('Error: Sistema de clientes no disponible');
                setClientesPendientes([]);
                return;
            }
            
            const pendientes = await window.getClientesPendientes();
            console.log('📋 Pendientes obtenidos:', pendientes);
            
            if (Array.isArray(pendientes)) {
                setClientesPendientes(pendientes);
            } else {
                console.error('❌ pendientes no es un array:', pendientes);
                setClientesPendientes([]);
            }
            setErrorClientes('');
        } catch (error) {
            console.error('Error cargando pendientes:', error);
            setErrorClientes('Error al cargar solicitudes');
            setClientesPendientes([]);
        } finally {
            setCargandoClientes(false);
        }
    };

    const loadClientesAutorizados = async () => {
        console.log('🔄 Cargando clientes autorizados...');
        setCargandoClientes(true);
        try {
            if (typeof window.getClientesAutorizados !== 'function') {
                console.error('❌ getClientesAutorizados no está definida');
                setClientesAutorizados([]);
                return;
            }
            
            const autorizados = await window.getClientesAutorizados();
            console.log('📋 Autorizados obtenidos:', autorizados);
            
            if (Array.isArray(autorizados)) {
                setClientesAutorizados(autorizados);
            } else {
                console.error('❌ autorizados no es un array:', autorizados);
                setClientesAutorizados([]);
            }
        } catch (error) {
            console.error('Error cargando autorizados:', error);
            setClientesAutorizados([]);
        } finally {
            setCargandoClientes(false);
        }
    };

    const handleAprobarCliente = async (whatsapp) => {
        console.log('✅ Aprobando:', whatsapp);
        try {
            if (typeof window.aprobarCliente !== 'function') {
                alert('Error: Sistema de clientes no disponible');
                return;
            }
            const cliente = await window.aprobarCliente(whatsapp);
            if (cliente) {
                await loadClientesPendientes();
                await loadClientesAutorizados();
                alert(`✅ Cliente ${cliente.nombre} aprobado`);
                const mensaje = `✅ ¡Hola ${cliente.nombre}! Tu acceso a Bennet Salon ha sido APROBADO. Ya podés reservar turnos desde la app.`;
                window.open(`https://wa.me/${cliente.whatsapp}?text=${encodeURIComponent(mensaje)}`, '_blank');
            }
        } catch (error) {
            console.error('Error aprobando:', error);
            alert('Error al aprobar cliente');
        }
    };

    const handleRechazarCliente = async (whatsapp) => {
        if (!confirm('¿Rechazar esta solicitud?')) return;
        console.log('❌ Rechazando:', whatsapp);
        try {
            if (typeof window.rechazarCliente !== 'function') {
                alert('Error: Sistema de clientes no disponible');
                return;
            }
            const resultado = await window.rechazarCliente(whatsapp);
            if (resultado) {
                await loadClientesPendientes();
            }
        } catch (error) {
            console.error('Error rechazando:', error);
            alert('Error al rechazar cliente');
        }
    };

    const handleEliminarAutorizado = async (whatsapp) => {
        if (!confirm('¿Seguro que querés eliminar este cliente autorizado? Perderá el acceso a la app.')) return;
        console.log('🗑️ Eliminando autorizado:', whatsapp);
        try {
            if (typeof window.eliminarClienteAutorizado !== 'function') {
                alert('Error: Función no disponible');
                return;
            }
            const resultado = await window.eliminarClienteAutorizado(whatsapp);
            if (resultado) {
                await loadClientesAutorizados();
                alert(`✅ Cliente eliminado`);
            }
        } catch (error) {
            console.error('Error eliminando autorizado:', error);
            alert('Error al eliminar cliente');
        }
    };

    // ============================================
    // FUNCIONES DE RESERVAS
    // ============================================
    const fetchBookings = async () => {
        setLoading(true);
        try {
            let data;
            
            if (userRole === 'trabajadora' && trabajadora) {
                console.log(`📋 Cargando reservas de trabajadora ${trabajadora.id}...`);
                data = await window.getReservasPorTrabajadora?.(trabajadora.id, false) || [];
            } else {
                data = await getAllBookings();
            }
            
            data.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio));
            setBookings(data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            alert('Error al cargar las reservas');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchBookings();
        
        if (userRole === 'admin' || (userRole === 'trabajadora' && userNivel >= 2)) {
            loadClientesAutorizados();
        }
        
        console.log('🔍 Verificando auth:', {
            userRole,
            userNivel,
            trabajadora
        });
    }, [userRole, userNivel, trabajadora]);

    const handleCancel = async (id, bookingData) => {
        if (!confirm(`¿Cancelar reserva de ${bookingData.cliente_nombre}?`)) return;
        const ok = await cancelBooking(id);
        if (ok) {
            const msg = `❌ Reserva cancelada\n\n${bookingData.cliente_nombre}, tu reserva del ${bookingData.fecha} a las ${formatTo12Hour(bookingData.hora_inicio)} fue cancelada.`;
            window.open(`https://wa.me/${bookingData.cliente_whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
            alert('✅ Reserva cancelada');
            fetchBookings();
        } else {
            alert('❌ Error al cancelar');
        }
    };

    const handleLogout = () => {
        if (confirm('¿Cerrar sesión?')) {
            localStorage.removeItem('adminAuth');
            localStorage.removeItem('adminUser');
            localStorage.removeItem('adminLoginTime');
            localStorage.removeItem('trabajadoraAuth');
            localStorage.removeItem('userRole');
            window.location.href = 'admin-login.html';
        }
    };

    // ============================================
    // FILTROS
    // ============================================
    const getFilteredBookings = () => {
        let filtered = filterDate
            ? bookings.filter(b => b.fecha === filterDate)
            : [...bookings];
        
        if (statusFilter === 'activas') {
            filtered = filtered.filter(b => b.estado !== 'Cancelado');
        } else if (statusFilter === 'canceladas') {
            filtered = filtered.filter(b => b.estado === 'Cancelado');
        }
        
        return filtered;
    };

    const activasCount = bookings.filter(b => b.estado !== 'Cancelado').length;
    const canceladasCount = bookings.filter(b => b.estado === 'Cancelado').length;
    const filteredBookings = getFilteredBookings();

    const getTabsDisponibles = () => {
        const tabs = [];
        tabs.push({ id: 'reservas', icono: '📅', label: userRole === 'trabajadora' ? 'Mis Reservas' : 'Reservas' });
        
        if (userRole === 'admin' || (userRole === 'trabajadora' && userNivel >= 2)) {
            tabs.push({ id: 'configuracion', icono: '⚙️', label: 'Configuración' });
            tabs.push({ id: 'clientes', icono: '👤', label: 'Clientes' });
        }
        
        if (userRole === 'admin' || (userRole === 'trabajadora' && userNivel >= 3)) {
            tabs.push({ id: 'servicios', icono: '💅', label: 'Servicios' });
            tabs.push({ id: 'trabajadoras', icono: '👥', label: 'Trabajadoras' });
        }
        
        return tabs;
    };

    const abrirModalNuevaReserva = () => {
        setNuevaReservaData({
            cliente_nombre: '',
            cliente_whatsapp: '',
            servicio: '',
            trabajador_id: userRole === 'trabajadora' ? trabajadora?.id : '',
            fecha: '',
            hora_inicio: ''
        });
        setCurrentDate(new Date());
        setDiasLaborales([]);
        setFechasConHorarios({});
        setShowNuevaReservaModal(true);
    };

    const tabsDisponibles = getTabsDisponibles();
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const days = getDaysInMonth();

    return (
        <div className="min-h-screen bg-gray-100 p-3 sm:p-6">
            <div className="max-w-6xl mx-auto space-y-4">
                
                {/* HEADER */}
                <div className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center flex-wrap gap-2">
                    <div>
                        <h1 className="text-xl font-bold">
                            {userRole === 'trabajadora' 
                                ? `Panel de ${trabajadora?.nombre}`
                                : 'Panel Admin - Bennet Salon'
                            }
                        </h1>
                        {userRole === 'trabajadora' && (
                            <p className="text-xs mt-1">
                                <span className={`px-2 py-0.5 rounded-full ${
                                    userNivel === 1 ? 'bg-gray-100 text-gray-600' :
                                    userNivel === 2 ? 'bg-blue-100 text-blue-600' :
                                    'bg-purple-100 text-purple-600'
                                }`}>
                                    {userNivel === 1 && '🔰 Nivel Básico'}
                                    {userNivel === 2 && '⭐ Nivel Intermedio'}
                                    {userNivel === 3 && '👑 Nivel Avanzado'}
                                </span>
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={abrirModalNuevaReserva}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition transform hover:scale-105 shadow-md"
                            title="Crear reserva para un cliente"
                        >
                            <span>📅</span>
                            <span className="hidden sm:inline">Nueva Reserva</span>
                        </button>
                        <button 
                            onClick={fetchBookings} 
                            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                            title="Actualizar"
                        >
                            🔄
                        </button>
                        <button 
                            onClick={handleLogout}
                            className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition"
                            title="Cerrar sesión"
                        >
                            🚪
                        </button>
                    </div>
                </div>

                {/* MODAL NUEVA RESERVA */}
                {showNuevaReservaModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">📅 Nueva Reserva Manual</h3>
                                <button 
                                    onClick={() => setShowNuevaReservaModal(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Nombre del cliente */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre del Cliente *
                                    </label>
                                    <input
                                        type="text"
                                        value={nuevaReservaData.cliente_nombre}
                                        onChange={(e) => setNuevaReservaData({...nuevaReservaData, cliente_nombre: e.target.value})}
                                        className="w-full border rounded-lg px-3 py-2"
                                        placeholder="Ej: Juan Pérez"
                                    />
                                </div>

                                {/* WhatsApp del cliente */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        WhatsApp del Cliente *
                                    </label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                                            +53
                                        </span>
                                        <input
                                            type="tel"
                                            value={nuevaReservaData.cliente_whatsapp}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '');
                                                setNuevaReservaData({...nuevaReservaData, cliente_whatsapp: value});
                                            }}
                                            className="w-full px-4 py-2 rounded-r-lg border border-gray-300"
                                            placeholder="54242576"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">8 dígitos después del +53</p>
                                </div>

                                {/* Selección de servicio */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Servicio *
                                    </label>
                                    <select
                                        value={nuevaReservaData.servicio}
                                        onChange={(e) => setNuevaReservaData({...nuevaReservaData, servicio: e.target.value})}
                                        className="w-full border rounded-lg px-3 py-2"
                                    >
                                        <option value="">Seleccionar servicio</option>
                                        {serviciosList.map(s => (
                                            <option key={s.id} value={s.nombre}>
                                                {s.nombre} ({s.duracion} min)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Selección de trabajadora */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Trabajadora *
                                    </label>
                                    {userRole === 'trabajadora' && userNivel <= 2 ? (
                                        <div className="bg-blue-50 p-3 rounded-lg">
                                            <p className="text-sm text-blue-700">
                                                Reserva asignada a vos: <strong>{trabajadora?.nombre}</strong>
                                            </p>
                                        </div>
                                    ) : (
                                        <select
                                            value={nuevaReservaData.trabajador_id}
                                            onChange={(e) => setNuevaReservaData({...nuevaReservaData, trabajador_id: e.target.value})}
                                            className="w-full border rounded-lg px-3 py-2"
                                        >
                                            <option value="">Seleccionar trabajadora</option>
                                            {trabajadorasList.map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {t.nombre} - {t.especialidad}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Calendario de fechas */}
                                {nuevaReservaData.trabajador_id && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Fecha *
                                        </label>
                                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                            <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-100">
                                                <button 
                                                    onClick={() => cambiarMes(-1)} 
                                                    className="p-2 hover:bg-white rounded-full transition-colors"
                                                >
                                                    ◀
                                                </button>
                                                <span className="font-bold text-gray-800">
                                                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                                                </span>
                                                <button 
                                                    onClick={() => cambiarMes(1)} 
                                                    className="p-2 hover:bg-white rounded-full transition-colors"
                                                >
                                                    ▶
                                                </button>
                                            </div>

                                            <div className="p-3">
                                                <div className="grid grid-cols-7 mb-2 text-center text-xs font-medium text-gray-400">
                                                    {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                                                        <div key={i}>{d}</div>
                                                    ))}
                                                </div>
                                                
                                                <div className="grid grid-cols-7 gap-1">
                                                    {days.map((date, idx) => {
                                                        if (!date) {
                                                            return <div key={idx} className="h-10" />;
                                                        }

                                                        const fechaStr = formatDate(date);
                                                        const available = isDateAvailable(date);
                                                        const selected = nuevaReservaData.fecha === fechaStr;
                                                        
                                                        let className = "h-10 w-full flex items-center justify-center rounded-lg text-sm font-medium transition-all relative";
                                                        
                                                        if (selected) {
                                                            className += " bg-pink-600 text-white shadow-md ring-2 ring-pink-300";
                                                        } else if (!available) {
                                                            className += " text-gray-300 cursor-not-allowed bg-gray-50";
                                                        } else {
                                                            className += " text-gray-700 hover:bg-pink-50 hover:text-pink-600 hover:scale-105 cursor-pointer";
                                                        }
                                                        
                                                        return (
                                                            <button
                                                                key={idx}
                                                                onClick={() => handleDateSelect(date)}
                                                                disabled={!available}
                                                                className={className}
                                                            >
                                                                {date.getDate()}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Horarios disponibles */}
                                {nuevaReservaData.fecha && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Hora de inicio *
                                        </label>
                                        {horariosDisponibles.length > 0 ? (
                                            <div className="grid grid-cols-3 gap-2">
                                                {horariosDisponibles.map(hora => (
                                                    <button
                                                        key={hora}
                                                        type="button"
                                                        onClick={() => setNuevaReservaData({...nuevaReservaData, hora_inicio: hora})}
                                                        className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                                                            nuevaReservaData.hora_inicio === hora
                                                                ? 'bg-pink-600 text-white'
                                                                : 'bg-gray-100 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {formatTo12Hour(hora)}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                                                No hay horarios disponibles para esta fecha
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Botones de acción */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setShowNuevaReservaModal(false)}
                                        className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleCrearReservaManual}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        Crear Reserva
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PESTAÑAS */}
                <div className="bg-white p-2 rounded-xl shadow-sm flex flex-wrap gap-2">
                    {tabsDisponibles.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setTabActivo(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                tabActivo === tab.id 
                                    ? 'bg-pink-600 text-white shadow-md scale-105' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <span>{tab.icono}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* CONTENIDO */}
                {tabActivo === 'configuracion' && (
                    <ConfigPanel 
                        trabajadoraId={userRole === 'trabajadora' ? trabajadora?.id : null}
                        modoRestringido={userRole === 'trabajadora' && userNivel === 2}
                    />
                )}

                {tabActivo === 'servicios' && (userRole === 'admin' || userNivel >= 3) && (
                    <ServiciosPanel />
                )}

                {tabActivo === 'trabajadoras' && (userRole === 'admin' || userNivel >= 3) && (
                    <TrabajadorasPanel />
                )}

                {tabActivo === 'clientes' && (userRole === 'admin' || userNivel >= 2) && (
                    <div className="space-y-4">
                        {cargandoClientes && (
                            <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-2">
                                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                <span className="text-blue-600">Cargando datos...</span>
                            </div>
                        )}

                        {/* CLIENTES AUTORIZADOS */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500">
                            <button
                                onClick={() => {
                                    setShowClientesAutorizados(!showClientesAutorizados);
                                    if (!showClientesAutorizados) loadClientesAutorizados();
                                }}
                                className="flex items-center justify-between w-full"
                            >
                                <div className="flex items-center gap-2">
                                    <span>✅</span>
                                    <span className="font-medium">Clientes Autorizados</span>
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                                        {clientesAutorizados.length}
                                    </span>
                                </div>
                                <span>{showClientesAutorizados ? '▲' : '▼'}</span>
                            </button>
                            
                            {showClientesAutorizados && (
                                <div className="mt-4">
                                    <div className="space-y-3 max-h-80 overflow-y-auto">
                                        {clientesAutorizados.length === 0 ? (
                                            <div className="text-center py-6 text-gray-500">
                                                <p>No hay clientes autorizados</p>
                                            </div>
                                        ) : (
                                            clientesAutorizados.map((cliente, index) => (
                                                <div key={index} className="bg-green-50 p-4 rounded-lg border border-green-200">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-bold text-gray-800">{cliente.nombre}</p>
                                                            <p className="text-sm text-gray-600">📱 +{cliente.whatsapp}</p>
                                                        </div>
                                                        {(userRole === 'admin' || userNivel >= 3) && cliente.whatsapp !== '5354066204' && (
                                                            <button
                                                                onClick={() => handleEliminarAutorizado(cliente.whatsapp)}
                                                                className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                                                            >
                                                                Quitar
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CLIENTES PENDIENTES */}
                        {(userRole === 'admin' || userNivel >= 3) && (
                            <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-yellow-500">
                                <button
                                    onClick={() => {
                                        setShowClientesPendientes(!showClientesPendientes);
                                        if (!showClientesPendientes) loadClientesPendientes();
                                    }}
                                    className="flex items-center justify-between w-full"
                                >
                                    <div className="flex items-center gap-2">
                                        <span>⏳</span>
                                        <span className="font-medium">Solicitudes Pendientes</span>
                                        {clientesPendientes.length > 0 && (
                                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                                                {clientesPendientes.length}
                                            </span>
                                        )}
                                    </div>
                                    <span>{showClientesPendientes ? '▲' : '▼'}</span>
                                </button>
                                
                                {showClientesPendientes && (
                                    <div className="mt-4">
                                        <div className="space-y-3 max-h-80 overflow-y-auto">
                                            {clientesPendientes.length === 0 ? (
                                                <div className="text-center py-6 text-gray-500">
                                                    <p>No hay solicitudes pendientes</p>
                                                </div>
                                            ) : (
                                                clientesPendientes.map((cliente, index) => (
                                                    <div key={index} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-bold text-gray-800">{cliente.nombre}</p>
                                                                <p className="text-sm text-gray-600">📱 +{cliente.whatsapp}</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleAprobarCliente(cliente.whatsapp)}
                                                                    className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                                                                >
                                                                    Aprobar
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRechazarCliente(cliente.whatsapp)}
                                                                    className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                                                                >
                                                                    Rechazar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* RESERVAS */}
                {tabActivo === 'reservas' && (
                    <>
                        {userRole === 'trabajadora' && trabajadora && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-blue-800 font-medium">
                                    Hola {trabajadora.nombre} 👋 - Mostrando tus reservas ({bookings.length})
                                </p>
                            </div>
                        )}

                        <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
                            <div className="flex flex-wrap gap-3 items-center">
                                <input 
                                    type="date" 
                                    value={filterDate} 
                                    onChange={(e) => setFilterDate(e.target.value)} 
                                    className="border rounded-lg px-3 py-2 text-sm"
                                />
                                {filterDate && (
                                    <button onClick={() => setFilterDate('')} className="text-red-500 text-sm">
                                        Limpiar
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setStatusFilter('activas')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                        statusFilter === 'activas' 
                                            ? 'bg-green-500 text-white' 
                                            : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    Activas ({activasCount})
                                </button>
                                <button
                                    onClick={() => setStatusFilter('canceladas')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                        statusFilter === 'canceladas' 
                                            ? 'bg-red-500 text-white' 
                                            : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    Canceladas ({canceladasCount})
                                </button>
                                <button
                                    onClick={() => setStatusFilter('todas')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                        statusFilter === 'todas' 
                                            ? 'bg-gray-800 text-white' 
                                            : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    Todas ({bookings.length})
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
                                <p className="text-gray-500 mt-4">Cargando reservas...</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredBookings.map(b => (
                                    <div key={b.id} className="bg-white p-4 rounded-xl shadow-sm">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-semibold">{b.fecha}</span>
                                            <span className="text-sm bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                                                {formatTo12Hour(b.hora_inicio)}
                                            </span>
                                        </div>
                                        <div className="text-sm space-y-1">
                                            <p>👤 {b.cliente_nombre}</p>
                                            <p>📱 {b.cliente_whatsapp}</p>
                                            <p>💅 {b.servicio}</p>
                                            <p>👩‍🎨 {b.trabajador_nombre}</p>
                                        </div>
                                        <div className="flex justify-between items-center mt-3 pt-2 border-t">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                ${b.estado === 'Reservado' ? 'bg-yellow-100 text-yellow-700' : 
                                                  b.estado === 'Cancelado' ? 'bg-red-100 text-red-700' : 
                                                  'bg-green-100 text-green-700'}`}>
                                                {b.estado}
                                            </span>
                                            {b.estado === 'Reservado' && (
                                                <button 
                                                    onClick={() => handleCancel(b.id, b)} 
                                                    className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                {filteredBookings.length === 0 && (
                                    <div className="text-center py-12 bg-white rounded-xl">
                                        <p className="text-gray-500">No hay reservas para mostrar</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AdminApp />);