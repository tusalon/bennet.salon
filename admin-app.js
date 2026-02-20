// admin-app.js - Bennet Salon (con botón de logout)

const SUPABASE_URL = 'https://bjpzdeixwkgpiqdjwclk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqcHpkZWl4d2tncGlxZGp3Y2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTUxMjIsImV4cCI6MjA4NzAzMTEyMn0.cJXxeKEj47kCir8lC91YWonuo7XN8UytBn58ki_cWoU';

const TABLE_NAME = 'bennet.salon';

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

const formatTo12Hour = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    let hour12 = hours % 12;
    hour12 = hour12 === 0 ? 12 : hour12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

function AdminApp() {
    const [bookings, setBookings] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [filterDate, setFilterDate] = React.useState('');

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

    const filteredBookings = filterDate
        ? bookings.filter(b => b.fecha === filterDate)
        : bookings;

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

                {/* Filtro */}
                <div className="bg-white p-4 rounded-xl shadow-sm flex gap-3">
                    <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="border rounded px-3 py-2" />
                    {filterDate && <button onClick={() => setFilterDate('')} className="text-red-500">Limpiar</button>}
                    <span className="ml-auto">Total: {filteredBookings.length}</span>
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
                        </div>

                        {/* Vista Desktop - Tabla */}
                        <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-4">Fecha/Hora</th>
                                        <th>Cliente</th>
                                        <th>WhatsApp</th>
                                        <th>Servicio</th>
                                        <th>Estado</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBookings.map(b => (
                                        <tr key={b.id} className="border-t">
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
                                                            className="p-2 bg-red-500 text-white rounded-lg">
                                                        ✗
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
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