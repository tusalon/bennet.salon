// components/TimeSlots.js - Versión con formato 12h (AM/PM)

function TimeSlots({ service, date, onTimeSelect, selectedTime }) {
    const [slots, setSlots] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    // Función para obtener la hora actual en formato 24h para comparar
    const getCurrentTimeString = () => {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    // Función para comparar horas (usa formato 24h internamente)
    const isTimePast = (timeStr24) => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        const [slotHour, slotMinute] = timeStr24.split(':').map(Number);
        
        if (slotHour < currentHour) return true;
        if (slotHour === currentHour && slotMinute < currentMinute) return true;
        return false;
    };

    React.useEffect(() => {
        if (!service || !date) return;

        const loadSlots = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Generar todos los horarios posibles (en formato 24h)
                const baseSlots = generateBaseSlots(service.duration);
                
                // 2. Verificar si la fecha seleccionada es HOY
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];
                const isToday = date === todayStr;
                
                // 3. Obtener turnos ocupados
                const bookings = await getBookingsByDate(date);
                
                // 4. Filtrar horarios ocupados
                let available24h = filterAvailableSlots(baseSlots, service.duration, bookings);
                
                // 5. Si es HOY, filtrar también las horas que ya pasaron
                if (isToday) {
                    available24h = available24h.filter(time => !isTimePast(time));
                }
                
                setSlots(available24h);
            } catch (err) {
                console.error(err);
                setError("Error al cargar horarios");
            } finally {
                setLoading(false);
            }
        };

        loadSlots();
    }, [service, date]);

    if (!service || !date) return null;

    return (
        <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <div className="icon-clock text-pink-500"></div>
                3. Elegí un horario
            </h2>

            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                </div>
            ) : error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
            ) : slots.length === 0 ? (
                <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="icon-calendar-x text-3xl text-gray-400 mb-2 mx-auto"></div>
                    <p className="text-gray-600">No hay horarios disponibles para esta fecha.</p>
                    <p className="text-sm text-gray-400 mt-1">Por favor, seleccioná otro día.</p>
                </div>
            ) : (
                <>
                    {/* Mensaje de horarios */}
                    <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded-lg flex items-center gap-2">
                        <div className="icon-info"></div>
                        <span>⏰ Mañana: 9 AM - 12 PM | Tarde: 1 PM - 6 PM</span>
                    </div>
                    
                    {/* Mensaje si es hoy y hay horarios filtrados */}
                    {date === new Date().toISOString().split('T')[0] && (
                        <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded-lg flex items-center gap-2">
                            <div className="icon-clock text-amber-500"></div>
                            <span>Solo se muestran horarios a partir de ahora</span>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {slots.map(time24h => {
                            // Convertir a formato 12h para mostrar
                            const time12h = formatTo12Hour(time24h);
                            return (
                                <button
                                    key={time24h}
                                    onClick={() => onTimeSelect(time24h)} // Guardamos en 24h
                                    className={`
                                        py-2 px-3 rounded-lg text-sm font-semibold transition-all shadow-sm
                                        ${selectedTime === time24h
                                            ? 'bg-green-600 text-white ring-2 ring-green-600 ring-offset-1'
                                            : 'bg-white text-green-700 border border-green-200 hover:bg-green-50 hover:border-green-300'}
                                    `}
                                >
                                    {time12h} {/* Mostramos 12h */}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}