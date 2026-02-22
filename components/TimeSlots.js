// components/TimeSlots.js - Versión con horarios por trabajadora

function TimeSlots({ service, date, worker, onTimeSelect, selectedTime }) {
    const [slots, setSlots] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [horariosTrabajadora, setHorariosTrabajadora] = React.useState(null);

    // Cargar horarios de la trabajadora
    React.useEffect(() => {
        if (!worker) return;
        
        const cargarHorarios = async () => {
            try {
                const horarios = await window.salonConfig.getHorariosTrabajadora(worker.id);
                console.log(`📅 Horarios de ${worker.nombre}:`, horarios);
                setHorariosTrabajadora(horarios);
            } catch (error) {
                console.error('Error cargando horarios:', error);
            }
        };
        
        cargarHorarios();
    }, [worker]);

    React.useEffect(() => {
        if (!service || !date || !worker || !horariosTrabajadora) return;

        const loadSlots = async () => {
            setLoading(true);
            setError(null);
            try {
                // Obtener el día de la semana
                const fecha = new Date(date);
                const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
                const diaSemana = diasSemana[fecha.getDay()];
                
                // Verificar si la trabajadora trabaja este día
                if (!horariosTrabajadora.dias?.includes(diaSemana)) {
                    setSlots([]);
                    setLoading(false);
                    return;
                }
                
                // Generar slots basados en las horas configuradas
                const horasActivas = horariosTrabajadora.horas || [];
                const baseSlots = horasActivas.map(h => `${h.toString().padStart(2, '0')}:00`);
                
                const todayStr = getCurrentLocalDate();
                const isToday = date === todayStr;
                
                // Obtener reservas existentes de la trabajadora
                const bookings = await getBookingsByDateAndWorker(date, worker.id);
                
                // Filtrar slots disponibles
                let availableSlots = baseSlots.filter(slotStartStr => {
                    const slotStart = timeToMinutes(slotStartStr);
                    const slotEnd = slotStart + service.duration;

                    // Verificar conflictos
                    const hasConflict = bookings.some(booking => {
                        const bookingStart = timeToMinutes(booking.hora_inicio);
                        const bookingEnd = timeToMinutes(booking.hora_fin);
                        return (slotStart < bookingEnd) && (slotEnd > bookingStart);
                    });

                    return !hasConflict;
                });
                
                if (isToday) {
                    availableSlots = availableSlots.filter(time => !isTimePassedToday(time));
                }
                
                availableSlots.sort();
                setSlots(availableSlots);
            } catch (err) {
                console.error(err);
                setError("Error al cargar horarios");
            } finally {
                setLoading(false);
            }
        };

        loadSlots();
    }, [service, date, worker, horariosTrabajadora]);

    if (!service || !date || !worker) return null;

    // Verificar si la trabajadora trabaja este día
    if (horariosTrabajadora && !horariosTrabajadora.dias?.includes(
        ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][new Date(date).getDay()]
    )) {
        return (
            <div className="space-y-4 animate-fade-in">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <div className="icon-clock text-pink-500"></div>
                    3. Elegí un horario con {worker.nombre}
                </h2>
                <div className="text-center p-8 bg-yellow-50 rounded-xl border border-yellow-200">
                    <div className="icon-calendar-off text-4xl text-yellow-400 mb-3 mx-auto"></div>
                    <p className="text-gray-700 font-medium">
                        {worker.nombre} no trabaja este día
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Elegí otro día de la semana</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <div className="icon-clock text-pink-500"></div>
                3. Elegí un horario con {worker.nombre}
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
                    <p className="text-gray-700 font-medium">
                        No hay horarios disponibles para {worker.nombre}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Probá con otra fecha</p>
                </div>
            ) : (
                <>
                    <div className="text-sm bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-700">
                            <div className="icon-clock text-blue-500"></div>
                            <span className="font-medium">
                                Horarios disponibles de {worker.nombre} para {date}:
                            </span>
                        </div>
                    </div>
                    
                    {date === getCurrentLocalDate() && (
                        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg flex items-center gap-2 border border-amber-200">
                            <div className="icon-clock text-amber-500"></div>
                            <span>Solo se muestran horarios que aún no pasaron</span>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                        {slots.map(time24h => {
                            const time12h = formatTo12Hour(time24h);
                            const isSelected = selectedTime === time24h;
                            
                            return (
                                <button
                                    key={time24h}
                                    onClick={() => onTimeSelect(time24h)}
                                    className={`
                                        py-3 px-2 rounded-lg text-base font-semibold transition-all transform
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