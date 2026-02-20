// admin-app.js - Bennet Salon (con filtros por estado)

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
    // 🔥 NUEVO: Estado para el filtro de estado
    const [statusFilter, setStatusFilter] = React.useState('activas'); // 'activas', 'canceladas', 'todas'

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

    // 🔥 NUEVO: Filtrar reservas según los criterios
    const getFilteredBookings = () => {
        // Primero filtramos por fecha si hay
        let filtered = filterDate
            ? bookings.filter(b => b.fecha === filterDate)
            : [...bookings];
        
        // Luego filtramos por estado
        if (statusFilter === 'activas') {
            filtered = filtered.filter(b => b.estado !== 'Cancelado');
        } else if (statusFilter === 'canceladas') {
            filtered = filtered.filter(b => b.estado === 'Cancelado');
        }
        // Si es 'todas', no filtramos por estado
        
        return filtered;
    };

    // 🔥 NUEVO: Contadores para los badges
    const activasCount = bookings.filter(b => b.estado !== 'Cancelado').length;
    const canceladasCount = bookings.filter(b => b.estado === 'Cancelado').length;
    const filteredBookings = getFilteredBookings();

    return (
        <div className="min-h-screen bg-gray-100 p-3 sm:p-6">
            <div className="max-w-6xl mx-auto space-y-4">
                {/* Header del panel con botón de logout */}
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

                {/* 🔥 NUEVO: Filtros superiores */}
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
                                    ? 'bg-green-500 text-white shadow-md' 
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
                                    ? 'bg-red-500 text-white shadow-md' 
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
                                    ? 'bg-gray-800 text-white shadow-md' 
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
                    <div className="text-center py-12">Cargando...</div>
                ) : (
                    <>
                        {/* Vista Móvil - Tarjetas */}
                        <div className="space-y-3 sm:hidden">
                            {filteredBookings.map(b => (
                                <div key={b.id} className="bg-white p-4 rounded-xl shadow-sm">
                                    <div className="flex justify-between mb-2">
                                        <span className="font-semibold">{b.fecha}</span>
                                        <span className="text-sm bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                                            {formatTo12Hour(b.hora_inicio)}
                                        </span>
                                    </div>
                                    <div className="text-sm space-y-1">
                                        <div>👤 {b.cliente_nombre}</div>
                                        <div>📱 {b.cliente_whatsapp}</div>
                                        <div>💅 {b.servicio}</div>
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
                                                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                                                ✗
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
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-4 text-left">Fecha/Hora</th>
                                        <th className="text-left">Cliente</th>
                                        <th className="text-left">WhatsApp</th>
                                        <th className="text-left">Servicio</th>
                                        <th className="text-left">Estado</th>
                                        <th className="text-left">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBookings.map(b => (
                                        <tr key={b.id} className="border-t hover:bg-gray-50">
                                            <td className="p-4">{b.fecha} {formatTo12Hour(b.hora_inicio)}</td>
                                            <td>{b.cliente_nombre}</td>
                                            <td>{b.cliente_whatsapp}</td>
                                            <td>{b.servicio}</td>
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
                                                    <button onClick={() => handleCancel(b.id, b)} 
                                                            className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">
                                                        Cancelar
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    
                                    {filteredBookings.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center py-12 text-gray-500">
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