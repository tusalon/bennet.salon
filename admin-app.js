// admin-app.js - Bennet Salon (con filtros, clientes pendientes y mejoras)

// 🔥 USAR LA MISMA CONFIGURACIÓN QUE api.js
const SUPABASE_URL = 'https://torwzztbyeryptydytwr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvcnd6enRieWVyeXB0eWR5dHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzODAxNzIsImV4cCI6MjA4Njk1NjE3Mn0.yISCKznhbQt5UAW5lwSuG2A2NUS71GSbirhpa9mMpyI';

const TABLE_NAME = 'benettsalon';

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

async function cancelBooking(id) {
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.${id}`,
        {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado: 'Cancelado' })
        }
    );
    return res.ok;
}

function AdminApp() {
    const [bookings, setBookings] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [filterDate, setFilterDate] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('activas');
    
    // 🔥 Estado para clientes pendientes
    const [showClientesPendientes, setShowClientesPendientes] = React.useState(false);
    const [clientesPendientes, setClientesPendientes] = React.useState([]);

    const fetchBookings = async () => {
        setLoading(true);
        const data = await getAllBookings();
        data.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio));
        setBookings(data);
        setLoading(false);
    };

    React.useEffect(() => {
        fetchBookings();
    }, []);

    const handleCancel = async (id, bookingData) => {
        if (!confirm(`¿Cancelar turno de ${bookingData.cliente_nombre}?`)) return;

        const ok = await cancelBooking(id);
        
        if (ok) {
            const msg = `❌ Turno cancelado\n\n${bookingData.cliente_nombre}, tu turno del ${bookingData.fecha} a las ${formatTo12Hour(bookingData.hora_inicio)} fue cancelado.`;
            window.open(`https://wa.me/${bookingData.cliente_whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
            
            alert('✅ Turno cancelado');
            fetchBookings();
        } else {
            alert('❌ Error al cancelar');
        }
    };

    // 🔥 Función para cerrar sesión
    const handleLogout = () => {
        if (confirm('¿Cerrar sesión?')) {
            localStorage.removeItem('adminAuth');
            localStorage.removeItem('adminUser');
            localStorage.removeItem('adminLoginTime');
            window.location.href = 'admin-login.html';
        }
    };

    // 🔥 Cargar clientes pendientes
    const loadClientesPendientes = () => {
        setClientesPendientes(getClientesPendientes());
    };

    // 🔥 Aprobar cliente
    const handleAprobarCliente = (whatsapp) => {
        const cliente = aprobarCliente(whatsapp);
        if (cliente) {
            loadClientesPendientes();
            alert(`✅ Cliente ${cliente.nombre} aprobado`);
            
            // Opcional: notificar al cliente por WhatsApp
            const msg = `✅ ¡Hola ${cliente.nombre}! Tu acceso a Bennet Salon ha sido aprobado. Ya podés reservar turnos desde la app.`;
            window.open(`https://wa.me/${cliente.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
        }
    };

    // 🔥 Rechazar cliente
    const handleRechazarCliente = (whatsapp) => {
        if (confirm('¿Rechazar esta solicitud?')) {
            const cliente = rechazarCliente(whatsapp);
            if (cliente) {
                loadClientesPendientes();
            }
        }
    };

    // 🔥 Filtrar reservas según los criterios
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

    // 🔥 Contadores
    const activasCount = bookings.filter(b => b.estado !== 'Cancelado').length;
    const canceladasCount = bookings.filter(b => b.estado === 'Cancelado').length;
    const filteredBookings = getFilteredBookings();

    return (
        <div className="min-h-screen bg-gray-100 p-3 sm:p-6">
            <div className="max-w-6xl mx-auto space-y-4">
                {/* Header del panel */}
                <div className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
                    <h1 className="text-xl font-bold">Panel Admin - Bennet Salon</h1>
                    <div className="flex gap-2">
                        <button onClick={fetchBookings} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200" title="Actualizar">
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

                {/* 🔥 SECCIÓN DE CLIENTES PENDIENTES */}
                <div className="bg-white p-4 rounded-xl shadow-sm">
                    <button
                        onClick={() => {
                            setShowClientesPendientes(!showClientesPendientes);
                            if (!showClientesPendientes) loadClientesPendientes();
                        }}
                        className="flex items-center justify-between w-full"
                    >
                        <div className="flex items-center gap-2">
                            <div className="icon-users text-pink-500"></div>
                            <span className="font-medium">Solicitudes de Clientes</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {clientesPendientes.length > 0 && (
                                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                                    {clientesPendientes.length} nueva{clientesPendientes.length !== 1 ? 's' : ''}
                                </span>
                            )}
                            <div className={`transform transition-transform ${showClientesPendientes ? 'rotate-180' : ''}`}>
                                <div className="icon-chevron-down"></div>
                            </div>
                        </div>
                    </button>
                    
                    {showClientesPendientes && (
                        <div className="mt-4 space-y-3 max-h-80 overflow-y-auto">
                            {clientesPendientes.length === 0 ? (
                                <div className="text-center py-6 text-gray-500">
                                    <div className="icon-check-circle text-3xl text-green-300 mb-2"></div>
                                    <p>No hay solicitudes pendientes</p>
                                </div>
                            ) : (
                                clientesPendientes.map((cliente, index) => (
                                    <div key={index} className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-gray-800 text-lg">{cliente.nombre}</p>
                                                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                    <div className="icon-smartphone text-xs"></div>
                                                    +{cliente.whatsapp}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                                    <div className="icon-calendar text-xs"></div>
                                                    Solicitó: {new Date(cliente.fechaSolicitud).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAprobarCliente(cliente.whatsapp)}
                                                    className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition transform hover:scale-105 shadow-sm flex items-center gap-1"
                                                    title="Aprobar acceso"
                                                >
                                                    <div className="icon-check"></div>
                                                    Aprobar
                                                </button>
                                                <button
                                                    onClick={() => handleRechazarCliente(cliente.whatsapp)}
                                                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition transform hover:scale-105 shadow-sm flex items-center gap-1"
                                                    title="Rechazar solicitud"
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
                    )}
                </div>

                {/* Filtros */}
                <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
                    {/* Filtro por fecha */}
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

                    {/* Filtro por estado */}
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

                    {/* Total mostrado */}
                    <div className="text-sm text-gray-500 border-t pt-2 mt-1">
                        Mostrando: <span className="font-bold text-pink-600">{filteredBookings.length}</span> turnos
                        {filterDate && <span> • Fecha: {filterDate}</span>}
                        {statusFilter !== 'todas' && (
                            <span> • {statusFilter === 'activas' ? 'Activas' : 'Canceladas'}</span>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
                        <p className="text-gray-500 mt-4">Cargando turnos...</p>
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
                                            <button onClick={() => handleCancel(b.id, b)} 
                                                    className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition transform hover:scale-105">
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            
                            {filteredBookings.length === 0 && (
                                <div className="text-center py-12 bg-white rounded-xl">
                                    <div className="icon-calendar-x text-4xl text-gray-300 mb-2"></div>
                                    <p className="text-gray-500">No hay turnos para mostrar</p>
                                </div>
                            )}
                        </div>

                        {/* Vista Desktop - Tabla */}
                        <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="p-4 text-left text-sm font-semibold text-gray-600">Fecha/Hora</th>
                                        <th className="text-left text-sm font-semibold text-gray-600">Cliente</th>
                                        <th className="text-left text-sm font-semibold text-gray-600">WhatsApp</th>
                                        <th className="text-left text-sm font-semibold text-gray-600">Servicio</th>
                                        <th className="text-left text-sm font-semibold text-gray-600">Estado</th>
                                        <th className="text-left text-sm font-semibold text-gray-600">Acción</th>
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
                                            <td>
                                                <a href={`https://wa.me/${b.cliente_whatsapp}`} target="_blank" 
                                                   className="text-green-600 hover:text-green-700 flex items-center gap-1">
                                                    <div className="icon-message-circle text-sm"></div>
                                                    {b.cliente_whatsapp}
                                                </a>
                                            </td>
                                            <td className="max-w-xs">
                                                <div className="truncate" title={b.servicio}>
                                                    {b.servicio}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold
                                                    ${b.estado === 'Confirmado' ? 'bg-green-100 text-green-700' : 
                                                      b.estado === 'Reservado' ? 'bg-yellow-100 text-yellow-700' : 
                                                      'bg-red-100 text-red-700'}`}>
                                                    {b.estado}
                                                </span>
                                            </td>
                                            <td>
                                                {b.estado === 'Reservado' && (
                                                    <button onClick={() => handleCancel(b.id, b)} 
                                                            className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition transform hover:scale-105">
                                                        Cancelar
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    
                                    {filteredBookings.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center py-12 text-gray-500">
                                                <div className="icon-calendar-x text-3xl text-gray-300 mb-2"></div>
                                                No hay turnos para mostrar
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AdminApp />);