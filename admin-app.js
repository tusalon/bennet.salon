// admin-app.js - Bennet Salon (VERSIÓN CORREGIDA)

// ✅ Usar la variable global de api.js, no redeclarar
// const TABLE_NAME = 'benettsalon'; ← ELIMINADO

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
    // DETECTAR ROL Y NIVEL DEL USUARIO AL INICIAR
    // ============================================
    React.useEffect(() => {
        // Verificar si hay una trabajadora autenticada
        const trabajadoraAuth = window.getTrabajadoraAutenticada?.();
        if (trabajadoraAuth) {
            console.log('👤 Usuario detectado como trabajadora:', trabajadoraAuth);
            setUserRole('trabajadora');
            setTrabajadora(trabajadoraAuth);
            setUserNivel(trabajadoraAuth.nivel || 1);
        } else {
            console.log('👑 Usuario detectado como admin');
            setUserRole('admin');
            setUserNivel(3);
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

    const tabsDisponibles = getTabsDisponibles();

    return (
        <div className="min-h-screen bg-gray-100 p-3 sm:p-6">
            <div className="max-w-6xl mx-auto space-y-4">
                
                {/* HEADER */}
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