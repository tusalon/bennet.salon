// admin-app.js - Bennet Salon (COMPLETO CON PESTAÑAS)

// 🔥 CONFIGURACIÓN SUPABASE
const SUPABASE_URL = 'https://torwzztbyeryptydytwr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvcnd6enRieWVyeXB0eWR5dHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzODAxNzIsImV4cCI6MjA4Njk1NjE3Mn0.yISCKznhbQt5UAW5lwSuG2A2NUS71GSbirhpa9mMpyI';

const TABLE_NAME = 'benettsalon';

// ============================================
// FUNCIONES DE SUPABASE
// ============================================
async function getAllBookings() {
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*&order=fecha.desc,hora_inicio.asc`,
        {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        }
    );
    return await res.json();
}

async function updateBookingStatus(id, newStatus) {
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.${id}`,
        {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado: newStatus })
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
    const [tabActivo, setTabActivo] = React.useState('reservas'); // 🔥 Cambiado a 'reservas'
    
    // Estados para clientes pendientes
    const [showClientesPendientes, setShowClientesPendientes] = React.useState(false);
    const [clientesPendientes, setClientesPendientes] = React.useState([]);
    const [showClientesAutorizados, setShowClientesAutorizados] = React.useState(false);
    const [clientesAutorizados, setClientesAutorizados] = React.useState([]);
    const [errorClientes, setErrorClientes] = React.useState('');

    // ============================================
    // FUNCIONES DE CLIENTES
    // ============================================
    const loadClientesPendientes = () => {
        console.log('🔄 Cargando clientes pendientes...');
        try {
            if (typeof window.getClientesPendientes !== 'function') {
                console.error('❌ getClientesPendientes no está definida');
                setErrorClientes('Error: Sistema de clientes no disponible');
                return;
            }
            const pendientes = window.getClientesPendientes();
            console.log('📋 Pendientes obtenidos:', pendientes);
            setClientesPendientes(pendientes);
            setErrorClientes('');
        } catch (error) {
            console.error('Error cargando pendientes:', error);
            setErrorClientes('Error al cargar solicitudes');
        }
    };

    const loadClientesAutorizados = () => {
        console.log('🔄 Cargando clientes autorizados...');
        try {
            if (typeof window.getClientesAutorizados !== 'function') {
                console.error('❌ getClientesAutorizados no está definida');
                return;
            }
            const autorizados = window.getClientesAutorizados();
            console.log('📋 Autorizados obtenidos:', autorizados);
            setClientesAutorizados(autorizados);
        } catch (error) {
            console.error('Error cargando autorizados:', error);
        }
    };

    const handleAprobarCliente = (whatsapp) => {
        console.log('✅ Aprobando:', whatsapp);
        try {
            if (typeof window.aprobarCliente !== 'function') {
                alert('Error: Sistema de clientes no disponible');
                return;
            }
            const cliente = window.aprobarCliente(whatsapp);
            if (cliente) {
                loadClientesPendientes();
                loadClientesAutorizados();
                alert(`✅ Cliente ${cliente.nombre} aprobado`);
                const mensaje = `✅ ¡Hola ${cliente.nombre}! Tu acceso a Bennet Salon ha sido APROBADO. Ya podés reservar turnos desde la app.`;
                window.open(`https://wa.me/${cliente.whatsapp}?text=${encodeURIComponent(mensaje)}`, '_blank');
            }
        } catch (error) {
            console.error('Error aprobando:', error);
            alert('Error al aprobar cliente');
        }
    };

    const handleRechazarCliente = (whatsapp) => {
        if (!confirm('¿Rechazar esta solicitud?')) return;
        console.log('❌ Rechazando:', whatsapp);
        try {
            if (typeof window.rechazarCliente !== 'function') {
                alert('Error: Sistema de clientes no disponible');
                return;
            }
            const cliente = window.rechazarCliente(whatsapp);
            if (cliente) {
                loadClientesPendientes();
            }
        } catch (error) {
            console.error('Error rechazando:', error);
            alert('Error al rechazar cliente');
        }
    };

    const handleEliminarAutorizado = (whatsapp) => {
        if (!confirm('¿Seguro que querés eliminar este cliente autorizado? Perderá el acceso a la app.')) return;
        console.log('🗑️ Eliminando autorizado:', whatsapp);
        try {
            if (typeof window.eliminarClienteAutorizado !== 'function') {
                alert('Error: Función no disponible');
                return;
            }
            const eliminado = window.eliminarClienteAutorizado(whatsapp);
            if (eliminado) {
                loadClientesAutorizados();
                alert(`✅ Cliente ${eliminado.nombre} eliminado`);
            }
        } catch (error) {
            console.error('Error eliminando autorizado:', error);
            alert('Error al eliminar cliente');
        }
    };

    // ============================================
    // FUNCIONES DE TURNOS (RESERVAS)
    // ============================================
    const fetchBookings = async () => {
        setLoading(true);
        try {
            const data = await getAllBookings();
            data.sort((a, b) => {
                if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
                return a.hora_inicio.localeCompare(b.hora_inicio);
            });
            setBookings(data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            alert('Error al cargar los turnos');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchBookings();
        loadClientesAutorizados();
        console.log('🔍 Verificando auth:', {
            getClientesPendientes: typeof window.getClientesPendientes,
            aprobarCliente: typeof window.aprobarCliente,
            rechazarCliente: typeof window.rechazarCliente,
            getClientesAutorizados: typeof window.getClientesAutorizados,
            eliminarClienteAutorizado: typeof window.eliminarClienteAutorizado
        });
    }, []);

    const handleStatusChange = async (id, newStatus, bookingData) => {
        if (!confirm(`¿Estás seguro de cambiar el estado a ${newStatus}?`)) return;
        
        try {
            await updateBookingStatus(id, newStatus);
            
            const phone = bookingData.cliente_whatsapp;
            let mensaje = "";
            
            if (newStatus === "Confirmado") {
                mensaje = `✅ *TURNO CONFIRMADO* ✅\n\nHola ${bookingData.cliente_nombre}, te confirmamos tu turno en *Bennet Salon*:\n\n📅 *Fecha:* ${bookingData.fecha}\n⏰ *Hora:* ${bookingData.hora_inicio}\n💅 *Servicio:* ${bookingData.servicio} (${bookingData.duracion} min)\n\n📱 Ante cualquier cambio, contactanos al +53 54066204\n\n¡Te esperamos! ✨`;
            } else if (newStatus === "Cancelado") {
                mensaje = `❌ *TURNO CANCELADO* ❌\n\nHola ${bookingData.cliente_nombre}, lamentamos informarte que tu turno del *${bookingData.fecha}* a las *${bookingData.hora_inicio}* ha sido cancelado.\n\nPor favor, contactanos para reagendar:\n📱 +53 54066204\n\nDisculpá las molestias.`;
            }
            
            const encodedMensaje = encodeURIComponent(mensaje);
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            
            if (isIOS) {
                window.location.href = `whatsapp://send?phone=${phone}&text=${encodedMensaje}`;
                setTimeout(() => {
                    window.location.href = `https://wa.me/${phone}?text=${encodedMensaje}`;
                }, 500);
            } else {
                window.open(`https://wa.me/${phone}?text=${encodedMensaje}`, '_blank');
            }
            
            fetchBookings();
        } catch (error) {
            alert('Error al actualizar');
        }
    };

    const handleLogout = () => {
        if (confirm('¿Cerrar sesión?')) {
            localStorage.removeItem('adminAuth');
            localStorage.removeItem('adminUser');
            localStorage.removeItem('adminLoginTime');
            window.location.href = 'admin-login.html';
        }
    };

    // ============================================
    // FILTROS
    // ============================================
    const filteredBookings = filterDate 
        ? bookings.filter(b => b.fecha === filterDate)
        : bookings;

    // ============================================
    // RENDER (JSX)
    // ============================================
    return (
        <div className="min-h-screen bg-gray-100 p-3 sm:p-6">
            <div className="max-w-6xl mx-auto space-y-4">
                
                {/* ===== HEADER ===== */}
                <div className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
                    <h1 className="text-xl font-bold">Panel Admin - Bennet Salon</h1>
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
                    {[
                        { id: 'reservas', icono: '📅', label: 'Reservas' }, // ✅ Cambiado a 'Reservas'
                        { id: 'configuracion', icono: '⚙️', label: 'Configuración' },
                        { id: 'servicios', icono: '💅', label: 'Servicios' },
                        { id: 'trabajadoras', icono: '👥', label: 'Trabajadoras' },
                        { id: 'clientes', icono: '👤', label: 'Clientes' }
                    ].map(tab => (
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
                
                {/* PESTAÑA: CONFIGURACIÓN */}
                {tabActivo === 'configuracion' && (
                    <ConfigPanel />
                )}

                {/* PESTAÑA: SERVICIOS */}
                {tabActivo === 'servicios' && (
                    <ServiciosPanel />
                )}

                {/* PESTAÑA: TRABAJADORAS */}
                {tabActivo === 'trabajadoras' && (
                    <TrabajadorasPanel />
                )}

                {/* PESTAÑA: CLIENTES */}
                {tabActivo === 'clientes' && (
                    <div className="space-y-4">
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
                                                        </div>
                                                        {cliente.whatsapp !== '5354066204' && (
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

                        {/* CLIENTES PENDIENTES */}
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
                                                                {new Date(cliente.fechaSolicitud).toLocaleString()}
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
                    </div>
                )}

                {/* PESTAÑA: RESERVAS (por defecto) */}
                {tabActivo === 'reservas' && (
                    <div className="space-y-4">
                        {/* FILTROS */}
                        <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 text-gray-600">
                                <div className="icon-list-filter"></div>
                                Filtrar por fecha:
                            </div>
                            <input 
                                type="date" 
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-pink-500"
                            />
                            {filterDate && (
                                <button onClick={() => setFilterDate('')} className="text-sm text-red-500 hover:underline">
                                    Limpiar filtro
                                </button>
                            )}
                        </div>

                        {/* LISTA DE RESERVAS */}
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin h-8 w-8 border-b-2 border-pink-600 rounded-full mx-auto"></div>
                                <p className="text-gray-500 mt-4">Cargando reservas...</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                                                <th className="p-4 font-semibold">Fecha/Hora</th>
                                                <th className="p-4 font-semibold">Cliente</th>
                                                <th className="p-4 font-semibold">WhatsApp</th>
                                                <th className="p-4 font-semibold">Servicio</th>
                                                <th className="p-4 font-semibold">Estado</th>
                                                <th className="p-4 font-semibold text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredBookings.map(booking => (
                                                <tr key={booking.id} className="hover:bg-gray-50">
                                                    <td className="p-4">
                                                        <div className="font-medium text-gray-900">{booking.fecha}</div>
                                                        <div className="text-sm text-gray-500">{booking.hora_inicio} - {booking.hora_fin}</div>
                                                    </td>
                                                    <td className="p-4 font-medium text-gray-900">
                                                        {booking.cliente_nombre}
                                                    </td>
                                                    <td className="p-4">
                                                        <a 
                                                            href={`https://wa.me/${booking.cliente_whatsapp}`} 
                                                            target="_blank"
                                                            className="text-green-600 hover:text-green-700 flex items-center gap-1 text-sm"
                                                        >
                                                            <div className="icon-message-circle"></div>
                                                            {booking.cliente_whatsapp}
                                                        </a>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-sm text-gray-900">{booking.servicio}</div>
                                                        <div className="text-xs text-gray-500">{booking.duracion} min</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                            ${booking.estado === 'Confirmado' ? 'bg-green-100 text-green-700' : 
                                                              booking.estado === 'Cancelado' ? 'bg-red-100 text-red-700' : 
                                                              'bg-yellow-100 text-yellow-700'}
                                                        `}>
                                                            {booking.estado}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right space-x-2">
                                                        {booking.estado !== 'Confirmado' && booking.estado !== 'Cancelado' && (
                                                            <button 
                                                                onClick={() => handleStatusChange(booking.id, 'Confirmado', booking)}
                                                                className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors"
                                                                title="Confirmar"
                                                            >
                                                                <div className="icon-check"></div>
                                                            </button>
                                                        )}
                                                        {booking.estado !== 'Cancelado' && (
                                                            <button 
                                                                onClick={() => handleStatusChange(booking.id, 'Cancelado', booking)}
                                                                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                                title="Cancelar"
                                                            >
                                                                <div className="icon-x"></div>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredBookings.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" className="p-8 text-center text-gray-500">
                                                        No se encontraron reservas.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
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