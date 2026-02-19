function AdminApp() {
    const [bookings, setBookings] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [filterDate, setFilterDate] = React.useState('');

    const fetchBookings = async () => {
        setLoading(true);
        const data = await getAllBookings();
        // Sort by date and time
        data.sort((a, b) => {
            if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
            return a.hora_inicio.localeCompare(b.hora_inicio);
        });
        setBookings(data);
        setLoading(false);
    };

    React.useEffect(() => {
        fetchBookings();
    }, []);

    // 🔥 FUNCIÓN ACTUALIZADA: Envía WhatsApp al cliente
    const handleStatusChange = async (id, newStatus, bookingData) => {
        if (!confirm(`¿Estás seguro de cambiar el estado a ${newStatus}?`)) return;
        
        try {
            // 1. Actualizar en Supabase
            await updateBookingStatus(id, newStatus);
            
            // 2. Enviar WhatsApp al cliente según el nuevo estado
            const phone = bookingData.cliente_whatsapp; // Número del cliente
            let mensaje = "";
            
            if (newStatus === "Confirmado") {
                mensaje = `✅ *TURNO CONFIRMADO* ✅\n\nHola ${bookingData.cliente_nombre}, te confirmamos tu turno en *Uñas Mágicas*:\n\n📅 *Fecha:* ${bookingData.fecha}\n⏰ *Hora:* ${bookingData.hora_inicio}\n💅 *Servicio:* ${bookingData.servicio} (${bookingData.duracion} min)\n\n📱 Ante cualquier cambio, contactanos al +53 54066204\n\n¡Te esperamos! ✨`;
            } else if (newStatus === "Cancelado") {
                mensaje = `❌ *TURNO CANCELADO* ❌\n\nHola ${bookingData.cliente_nombre}, lamentamos informarte que tu turno del *${bookingData.fecha}* a las *${bookingData.hora_inicio}* ha sido cancelado.\n\nPor favor, contactanos para reagendar:\n📱 +53 54066204\n\nDisculpá las molestias.`;
            }
            
            const encodedMensaje = encodeURIComponent(mensaje);
            
            // Detectar si es iPhone para usar esquema nativo
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            
            if (isIOS) {
                window.location.href = `whatsapp://send?phone=${phone}&text=${encodedMensaje}`;
                setTimeout(() => {
                    window.location.href = `https://wa.me/${phone}?text=${encodedMensaje}`;
                }, 500);
            } else {
                window.open(`https://wa.me/${phone}?text=${encodedMensaje}`, '_blank');
            }
            
            fetchBookings(); // Refresh
        } catch (error) {
            alert('Error al actualizar');
        }
    };

    const filteredBookings = filterDate 
        ? bookings.filter(b => b.fecha === filterDate)
        : bookings;

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <div className="icon-shield-check text-blue-600"></div>
                        Panel de Administración
                    </h1>
                    <button onClick={fetchBookings} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                        <div className="icon-refresh-cw text-gray-600"></div>
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-600">
                        <div className="icon-list-filter"></div>
                        Filtrar por fecha:
                    </div>
                    <input 
                        type="date" 
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                    />
                    {filterDate && (
                        <button onClick={() => setFilterDate('')} className="text-sm text-red-500 hover:underline">
                            Limpiar
                        </button>
                    )}
                </div>

                {/* List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto"></div>
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
                                                No se encontraron turnos.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AdminApp />);