// components/TimeSlots.js - Versión con solo 2 turnos e indicadores

function TimeSlots({ service, date, onTimeSelect, selectedTime }) {
    const [slots, setSlots] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        if (!service || !date) return;

        const loadSlots = async () => {
            setLoading(true);
            setError(null);
            try {
                const baseSlots = generateBaseSlots(service.duration);
                const todayStr = getCurrentLocalDate();
                const isToday = date === todayStr;
                const bookings = await getBookingsByDate(date);
                
                let available24h = filterAvailableSlots(baseSlots, service.duration, bookings);
                
                if (isToday) {
                    available24h = available24h.filter(time => !isTimePassedToday(time));
                }
                
                available24h.sort();
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
                {selectedTime && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2">
                        ✓ Horario seleccionado
                    </span>
                )}
            </h2>

            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                </div>
            ) : error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
            ) : slots.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="icon-calendar-x text-4xl text-gray-400 mb-3 mx-auto"></div>
                    <p className="text-gray-700 font-medium">No hay horarios disponibles</p>
                    <p className="text-sm text-gray-500 mt-1">Los turnos son 8:00 AM y 2:00 PM</p>
                    <p className="text-sm text-gray-400 mt-3">Probá con otra fecha</p>
                </div>
            ) : (
                <>
                    <div className="text-sm bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-700">
                            <div className="icon-clock text-blue-500"></div>
                            <span className="font-medium">Horarios disponibles para {date}:</span>
                        </div>
                        <div className="flex gap-4 mt-2 justify-center">
                            <span className="text-xs bg-white px-3 py-1 rounded-full shadow-sm">8:00 AM</span>
                            <span className="text-xs bg-white px-3 py-1 rounded-full shadow-sm">2:00 PM</span>
                        </div>
                    </div>
                    
                    {date === getCurrentLocalDate() && (
                        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg flex items-center gap-2 border border-amber-200">
                            <div className="icon-clock text-amber-500"></div>
                            <span>Solo se muestran horarios que aún no pasaron</span>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mt-4">
                        {slots.map(time24h => {
                            const time12h = formatTo12Hour(time24h);
                            const isSelected = selectedTime === time24h;
                            
                            return (
                                <button
                                    key={time24h}
                                    onClick={() => onTimeSelect(time24h)}
                                    className={`
                                        py-4 px-3 rounded-xl text-lg font-bold transition-all transform
                                        ${isSelected
                                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-105 ring-2 ring-pink-300'
                                            : 'bg-white text-gray-700 border-2 border-pink-200 hover:border-pink-400 hover:bg-pink-50 hover:scale-105 hover:shadow-md'}
                                    `}
                                >
                                    {time12h}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}