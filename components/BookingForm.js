// components/BookingForm.js - VERSIÓN ACTUALIZADA con el nuevo createBooking

function BookingForm({ service, date, time, onSubmit, onCancel }) {
    const [name, setName] = React.useState('');
    const [whatsapp, setWhatsapp] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !whatsapp.trim()) return;

        setSubmitting(true);
        setError(null);

        try {
            const bookings = await getBookingsByDate(date);
            const baseSlots = [time];
            const available = filterAvailableSlots(baseSlots, service.duration, bookings);

            if (available.length === 0) {
                setError("Ese horario ya no está disponible. Por favor elegí otro.");
                setSubmitting(false);
                return;
            }

            const endTime = calculateEndTime(time, service.duration);

            const numeroLimpio = whatsapp.replace(/\D/g, '');
            const numeroCompleto = `53${numeroLimpio}`;

            const bookingData = {
                cliente_nombre: name,
                cliente_whatsapp: numeroCompleto,
                servicio: service.name,
                duracion: service.duration,
                fecha: date,
                hora_inicio: time,
                hora_fin: endTime,
                estado: "Reservado"
            };

            // ✅ Ahora createBooking devuelve los datos reales de la BD
            const result = await createBooking(bookingData);
            
            // Pasamos los datos reales (con ID, etc.) al componente de confirmación
            onSubmit(result.data);

        } catch (err) {
            console.error(err);
            setError("Ocurrió un error al guardar la reserva. Intentá nuevamente.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <h3 className="text-xl font-bold text-gray-900">Confirmar Reserva</h3>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                        <div className="icon-x text-2xl"></div>
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Resumen del turno */}
                    <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 space-y-2">
                        <div className="flex items-center gap-3 text-gray-700">
                            <div className="icon-sparkles text-pink-500"></div>
                            <span className="font-medium">{service.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <div className="icon-calendar text-pink-500"></div>
                            <span>{date}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <div className="icon-clock text-pink-500"></div>
                            <span>{formatTo12Hour(time)} ({service.duration} min)</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tu Nombre</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all"
                                placeholder="Ingresá tu nombre completo"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tu WhatsApp <span className="text-gray-400 text-xs">(para notificaciones)</span>
                            </label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                    +53
                                </span>
                                <input
                                    type="tel"
                                    value={whatsapp}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        setWhatsapp(value);
                                    }}
                                    className="w-full px-4 py-3 rounded-r-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all"
                                    placeholder="Ej: 54066204"
                                    required
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Ingresá solo los números después del +53</p>
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg flex items-start gap-2">
                                <div className="icon-triangle-alert mt-0.5"></div>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                                    Procesando...
                                </>
                            ) : (
                                "Confirmar Reserva"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}