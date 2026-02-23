// admin-app.js - Bennet Salon (VERSIÓN CON NIVELES DE PERMISO)

const TABLE_NAME = 'benettsalon';

// ============================================
// FUNCIONES DE SUPABASE
// ============================================
async function getAllBookings() {
    const res = await fetch(
        `${window.SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*&order=fecha.desc,hora_inicio.asc`,
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
        `${window.SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.${id}`,
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
    const [userNivel, setUserNivel] = React.useState(3); // 3 = acceso total por defecto para admin
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
    // DETECTAR ROL Y NIVEL DEL USUARIO AL INICIAR
    // ============================================
    React.useEffect(() => {
        // Verificar si hay una trabajadora autenticada
        const trabajadoraAuth = window.getTrabajadoraAutenticada?.();
        if (trabajadoraAuth) {
            console.log('👤 Usuario detectado como trabajadora:', trabajadoraAuth);
            setUserRole('trabajadora');
            setTrabajadora(trabajadoraAuth);
            setUserNivel(trabajadoraAuth.nivel || 1); // 🔥 NUEVO: nivel de permiso
        } else {
            console.log('👑 Usuario detectado como admin');
            setUserRole('admin');
            setUserNivel(3); // Admin siempre tiene nivel 3
        }
    }, []);

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
            
            // Si es trabajadora, obtener solo sus reservas
            if (userRole === 'trabajadora' && trabajadora) {
                console.log(`📋 Cargando reservas de trabajadora ${trabajadora.id}...`);
                data = await window.getReservasPorTrabajadora?.(trabajadora.id, false) || [];
            } else {
                // Si es admin, obtener todas
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
        
        // Solo cargar clientes si es admin o trabajadora nivel 2 o 3
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
            // Limpiar todo
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
        // Primero filtrar por fecha si hay
        let filtered = filterDate
            ? bookings.filter(b => b.fecha === filterDate)
            : [...bookings];
        
        // Luego por estado
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

    // 🔥 NUEVO: Función para determinar qué pestañas mostrar según nivel
    const getTabsDisponibles = () => {
        const tabs = [];
        
        // Reservas: visible para todos (nivel 1, 2, 3)
        tabs.push({ id: 'reservas', icono: '📅', label: userRole === 'trabajadora' ? 'Mis Reservas' : 'Reservas' });
        
        // Si es admin o trabajadora nivel 2 o 3
        if (userRole === 'admin' || (userRole === 'trabajadora' && userNivel >= 2)) {
            // Configuración: solo para nivel 2 y 3 (pero con restricciones)
            tabs.push({ id: 'configuracion', icono: '⚙️', label: 'Configuración' });
            
            // Clientes: para nivel 2 y 3
            tabs.push({ id: 'clientes', icono: '👤', label: 'Clientes' });
        }
        
        // Si es admin o trabajadora nivel 3 (acceso total)
        if (userRole === 'admin' || (userRole === 'trabajadora' && userNivel >= 3)) {
            tabs.push({ id: 'servicios', icono: '💅', label: 'Servicios' });
            tabs.push({ id: 'trabajadoras', icono: '👥', label: 'Trabajadoras' });
        }
        
        return tabs;
    };

    // ============================================
    // RENDER (JSX)
    // ============================================
    const tabsDisponibles = getTabsDisponibles();

    return (
        <div className="min-h-screen bg-gray-100 p-3 sm:p-6">
            <div className="max-w-6xl mx-auto space-y-4">
                
                {/* ===== HEADER ===== */}
                <div className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
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
                            onClick={fetchBookings} 
                            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                            title="Actualizar"
                        >
                            <div className="icon-refresh-cw"></div>
                        </button>
                        <button 
                            onClick={handleLogout}
                            className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition"
                            title="Cerrar sesión"
                        >
                            <div className="icon-log-out"></div>
                        </button>
                    </div>
                </div>

                {/* ===== PESTAÑAS DE NAVEGACIÓN ===== */}
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

                {/* ===== CONTENIDO SEGÚN PESTAÑA ===== */}
                
                {/* PESTAÑA: CONFIGURACIÓN - Mostrar ConfigPanel pero con restricciones */}
                {tabActivo === 'configuracion' && (
                    <ConfigPanel 
                        trabajadoraId={userRole === 'trabajadora' ? trabajadora?.id : null}
                        modoRestringido={userRole === 'trabajadora' && userNivel === 2}
                    />
                )}

                {/* PESTAÑA: SERVICIOS (solo admin o nivel 3) */}
                {tabActivo === 'servicios' && (userRole === 'admin' || userNivel >= 3) && (
                    <ServiciosPanel />
                )}

                {/* PESTAÑA: TRABAJADORAS (solo admin o nivel 3) */}
                {tabActivo === 'trabajadoras' && (userRole === 'admin' || userNivel >= 3) && (
                    <TrabajadorasPanel />
                )}

                {/* PESTAÑA: CLIENTES (admin o nivel 2 o 3) */}
                {tabActivo === 'clientes' && (userRole === 'admin' || userNivel >= 2) && (
                    <div className="space-y-4">
                        {/* Indicador de carga */}
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
                                    <div className="icon-check-circle text-green-500"></div>
                                    <span className="font-medium">Clientes Autorizados</span>
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                                        {clientesAutorizados.length}
                                    </span>
                                </div>
                                <div className={`transform transition-transform ${showClientesAutorizados ? 'rotate-180' : ''}`}>
                                    <div className="icon-chevron-down"></div>
                                </div>
                            </button>
                            
                            {showClientesAutorizados && (
                                <div className="mt-4">
                                    <div className="space-y-3 max-h-80 overflow-y-auto">
                                        {clientesAutorizados.length === 0 ? (
                                            <div className="text-center py-6 text-gray-500">
                                                <div className="icon-users text-3xl text-gray-300 mb-2"></div>
                                                <p>No hay clientes autorizados</p>
                                            </div>
                                        ) : (
                                            clientesAutorizados.map((cliente, index) => (
                                                <div key={index} className="bg-gradient-to-r from-green-50 to-white p-4 rounded-lg border border-green-200 shadow-sm">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-bold text-gray-800 text-lg">{cliente.nombre}</p>
                                                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                                <div className="icon-smartphone text-xs"></div>
                                                                +{cliente.whatsapp}
                                                            </p>
                                                            {cliente.fecha_aprobacion && (
                                                                <p className="text-xs text-gray-400 mt-1">
                                                                   Aprobado: {new Date(cliente.fecha_aprobacion).toLocaleDateString()}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {(userRole === 'admin' || userNivel >= 3) && cliente.whatsapp !== '5354066204' && (
                                                            <button
                                                                onClick={() => handleEliminarAutorizado(cliente.whatsapp)}
                                                                className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition transform hover:scale-105 shadow-sm flex items-center gap-1"
                                                                title="Eliminar acceso"
                                                            >
                                                                <div className="icon-trash-2"></div>
                                                                Quitar
                                                            </button>
                                                        )}
                                                        {cliente.whatsapp === '5354066204' && (
                                                            <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-lg text-sm">
                                                                Dueño
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CLIENTES PENDIENTES - Solo admin o nivel 3 pueden gestionar */}
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
                                        <div className="icon-users text-yellow-500"></div>
                                        <span className="font-medium">Solicitudes Pendientes</span>
                                        {clientesPendientes.length > 0 && (
                                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                                                {clientesPendientes.length}
                                            </span>
                                        )}
                                    </div>
                                    <div className={`transform transition-transform ${showClientesPendientes ? 'rotate-180' : ''}`}>
                                        <div className="icon-chevron-down"></div>
                                    </div>
                                </button>
                                
                                {showClientesPendientes && (
                                    <div className="mt-4">
                                        {errorClientes && (
                                            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-3 text-sm">
                                                {errorClientes}
                                            </div>
                                        )}
                                        
                                        <div className="space-y-3 max-h-80 overflow-y-auto">
                                            {clientesPendientes.length === 0 ? (
                                                <div className="text-center py-6 text-gray-500">
                                                    <div className="icon-check-circle text-3xl text-green-300 mb-2"></div>
                                                    <p>No hay solicitudes pendientes</p>
                                                </div>
                                            ) : (
                                                clientesPendientes.map((cliente, index) => (
                                                    <div key={index} className="bg-gradient-to-r from-yellow-50 to-white p-4 rounded-lg border border-yellow-200 shadow-sm">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-bold text-gray-800 text-lg">{cliente.nombre}</p>
                                                                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                                    <div className="icon-smartphone text-xs"></div>
                                                                    +{cliente.whatsapp}
                                                                </p>
                                                                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                                                    <div className="icon-calendar text-xs"></div>
                                                                    {new Date(cliente.fecha_solicitud).toLocaleString()}
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleAprobarCliente(cliente.whatsapp)}
                                                                    className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition transform hover:scale-105 shadow-sm flex items-center gap-1"
                                                                >
                                                                    <div className="icon-check"></div>
                                                                    Aprobar
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRechazarCliente(cliente.whatsapp)}
                                                                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition transform hover:scale-105 shadow-sm flex items-center gap-1"
                                                                >
                                                                    <div className="icon-x"></div>
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

                {/* PESTAÑA: RESERVAS (visible para todos) */}
                {tabActivo === 'reservas' && (
                    <>
                        {/* Banner para trabajadoras */}
                        {userRole === 'trabajadora' && trabajadora && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <div className="icon-user-check text-blue-600 text-xl"></div>
                                    <div>
                                        <p className="text-blue-800 font-medium">
                                            Hola {trabajadora.nombre} 👋
                                        </p>
                                        <p className="text-blue-600 text-sm">
                                            Mostrando solo tus reservas ({bookings.length} en total)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FILTROS DE RESERVAS */}
                        <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
                            <div className="flex flex-wrap gap-3 items-center">
                                <div className="flex items-center gap-2">
                                    <div className="icon-calendar text-gray-400"></div>
                                    <input 
                                        type="date" 
                                        value={filterDate} 
                                        onChange={(e) => setFilterDate(e.target.value)} 
                                        className="border rounded-lg px-3 py-2 text-sm"
                                    />
                                    {filterDate && (
                                        <button 
                                            onClick={() => setFilterDate('')} 
                                            className="text-red-500 text-sm hover:text-red-700"
                                        >
                                            Limpiar
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setStatusFilter('activas')}
                                    className={`
                                        px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                                        ${statusFilter === 'activas' 
                                            ? 'bg-green-500 text-white shadow-md scale-105' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                                    `}
                                >
                                    <div className="icon-check-circle"></div>
                                    Activas ({activasCount})
                                </button>
                                <button
                                    onClick={() => setStatusFilter('canceladas')}
                                    className={`
                                        px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                                        ${statusFilter === 'canceladas' 
                                            ? 'bg-red-500 text-white shadow-md scale-105' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                                    `}
                                >
                                    <div className="icon-x-circle"></div>
                                    Canceladas ({canceladasCount})
                                </button>
                                <button
                                    onClick={() => setStatusFilter('todas')}
                                    className={`
                                        px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                                        ${statusFilter === 'todas' 
                                            ? 'bg-gray-800 text-white shadow-md scale-105' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                                    `}
                                >
                                    <div className="icon-layers"></div>
                                    Todas ({bookings.length})
                                </button>
                            </div>

                            <div className="text-sm text-gray-500 border-t pt-2 mt-1">
                                Mostrando: <span className="font-bold text-pink-600">{filteredBookings.length}</span> reservas
                                {filterDate && <span> • Fecha: {filterDate}</span>}
                                {statusFilter !== 'todas' && (
                                    <span> • {statusFilter === 'activas' ? 'Activas' : 'Canceladas'}</span>
                                )}
                                {userRole === 'trabajadora' && (
                                    <span> • Solo tus reservas</span>
                                )}
                            </div>
                        </div>

                        {/* LISTADO DE RESERVAS */}
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
                                <p className="text-gray-500 mt-4">Cargando reservas...</p>
                            </div>
                        ) : (
                            <>
                                {/* Vista Móvil - Tarjetas */}
                                <div className="space-y-3 sm:hidden">
                                    {filteredBookings.map(b => (
                                        <div key={b.id} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition">
                                            <div className="flex justify-between mb-2">
                                                <span className="font-semibold">{b.fecha}</span>
                                                <span className="text-sm bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                                                    {formatTo12Hour(b.hora_inicio)}
                                                </span>
                                            </div>
                                            <div className="text-sm space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="icon-user text-gray-400"></div>
                                                    <span>{b.cliente_nombre}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="icon-message-circle text-gray-400"></div>
                                                    <span>{b.cliente_whatsapp}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="icon-sparkles text-gray-400"></div>
                                                    <span>{b.servicio}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center mt-3 pt-2 border-t">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                    ${b.estado === 'Confirmado' ? 'bg-green-100 text-green-700' : 
                                                      b.estado === 'Reservado' ? 'bg-yellow-100 text-yellow-700' : 
                                                      'bg-red-100 text-red-700'}`}>
                                                    {b.estado}
                                                </span>
                                                {b.estado === 'Reservado' && (
                                                    <button 
                                                        onClick={() => handleCancel(b.id, b)} 
                                                        className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition transform hover:scale-105"
                                                    >
                                                        Cancelar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {filteredBookings.length === 0 && (
                                        <div className="text-center py-12 bg-white rounded-xl">
                                            <div className="icon-calendar-x text-4xl text-gray-300 mb-2"></div>
                                            <p className="text-gray-500">No hay reservas para mostrar</p>
                                        </div>
                                    )}
                                </div>

                                {/* Vista Desktop - Tabla */}
                                <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                            <tr>
                                                <th className="p-4 text-left text-sm font-semibold text-gray-600">Fecha/Hora</th>
                                                <th className="p-4 text-left text-sm font-semibold text-gray-600">Cliente</th>
                                                <th className="p-4 text-left text-sm font-semibold text-gray-600">WhatsApp</th>
                                                <th className="p-4 text-left text-sm font-semibold text-gray-600">Servicio</th>
                                                {userRole === 'admin' && (
                                                    <th className="p-4 text-left text-sm font-semibold text-gray-600">Trabajador</th>
                                                )}
                                                <th className="p-4 text-left text-sm font-semibold text-gray-600">Estado</th>
                                                <th className="p-4 text-left text-sm font-semibold text-gray-600">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredBookings.map(b => (
                                                <tr key={b.id} className="border-t hover:bg-gray-50 transition">
                                                    <td className="p-4">
                                                        <div className="font-medium">{b.fecha}</div>
                                                        <div className="text-sm text-gray-500">{formatTo12Hour(b.hora_inicio)}</div>
                                                    </td>
                                                    <td className="font-medium">{b.cliente_nombre}</td>
                                                    <td>{b.cliente_whatsapp}</td>
                                                    <td>{b.servicio}</td>
                                                    {userRole === 'admin' && (
                                                        <td>
                                                            <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs">
                                                                {b.trabajador_nombre || 'No asignado'}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                            ${b.estado === 'Confirmado' ? 'bg-green-100 text-green-700' : 
                                                              b.estado === 'Reservado' ? 'bg-yellow-100 text-yellow-700' : 
                                                              'bg-red-100 text-red-700'}`}>
                                                            {b.estado}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {b.estado === 'Reservado' && (
                                                            <button 
                                                                onClick={() => handleCancel(b.id, b)} 
                                                                className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition transform hover:scale-105"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            
                                            {filteredBookings.length === 0 && (
                                                <tr>
                                                    <td colSpan={userRole === 'admin' ? "7" : "6"} className="text-center py-12 text-gray-500">
                                                        <div className="icon-calendar-x text-3xl text-gray-300 mb-2"></div>
                                                        No hay reservas para mostrar
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ============================================
// RENDER
// ============================================
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AdminApp />);