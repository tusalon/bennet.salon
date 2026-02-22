// components/TimeSlots.js - Versión corregida (orden de ejecución)

function TimeSlots({ service, date, worker, onTimeSelect, selectedTime }) {
    const [slots, setSlots] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [horariosTrabajadora, setHorariosTrabajadora] = React.useState(null);
    const [diaTrabaja, setDiaTrabaja] = React.useState(true);
    const [verificacionCompleta, setVerificacionCompleta] = React.useState(false);

    // Cargar horarios de la trabajadora (solo cuando cambia worker)
    React.useEffect(() => {
        if (!worker) return;
        
        const cargarHorarios = async () => {
            setVerificacionCompleta(false);
            try {
                console.log(`📅 Cargando horarios de ${worker.nombre}...`);
                const horarios = await window.salonConfig.getHorariosTrabajadora(worker.id);
                console.log(`✅ Horarios de ${worker.nombre}:`, horarios);
                setHorariosTrabajadora(horarios);
            } catch (error) {
                console.error('Error cargando horarios:', error);
                setHorariosTrabajadora({ horas: [], dias: [] });
            }
        };
        
        cargarHorarios();
    }, [worker]);

    // Verificar si trabaja este día (cuando cambian horarios o fecha)
    React.useEffect(() => {
        if (!worker || !horariosTrabajadora || !date) {
            setVerificacionCompleta(false);
            return;
        }

        console.log('🔍 Verificando disponibilidad para:', {
            worker: worker.nombre,
            fecha: date,
            horarios: horariosTrabajadora
        });

        const fecha = new Date(date);
        const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const diaSemana = diasSemana[fecha.getDay()];
        
        console.log(`📆 Día seleccionado: ${diaSemana} (${fecha.getDay()})`);
        console.log(`📋 Días laborales de ${worker.nombre}:`, horariosTrabajadora.dias);
        
        // Si no hay configuración de días, asumir que todos los días son laborales
        if (!horariosTrabajadora.dias || horariosTrabajadora.dias.length === 0) {
            console.log('⚠️ No hay configuración de días, se asumen todos disponibles');
            setDiaTrabaja(true);
            setVerificacionCompleta(true);
            return;
        }
        
        const trabaja = horariosTrabajadora.dias.includes(diaSemana);
        console.log(`🎯 ¿${worker.nombre} trabaja el ${diaSemana}?`, trabaja);
        
        setDiaTrabaja(trabaja);
        setVerificacionCompleta(true);
        
    }, [worker, horariosTrabajadora, date]);

    // Cargar slots disponibles (solo cuando todo está verificado y el día es laboral)
    React.useEffect(() => {
        if (!service || !date || !worker || !horariosTrabajadora || !verificacionCompleta) return;
        
        if (!diaTrabaja) {
            setSlots([]);
            return;
        }

        const loadSlots = async () => {
            setLoading(true);
            setError(null);
            try {
                // Verificar si hay horas configuradas
                if (!horariosTrabajadora.horas || horariosTrabajadora.horas.length === 0) {
                    console.log('⚠️ No hay horas configuradas para esta trabajadora');
                    setSlots([]);
                    setLoading(false);
                    return;
                }
                
                // Generar slots basados en las horas configuradas
                const baseSlots = horariosTrabajadora.horas.map(h => 
                    `${h.toString().padStart(2, '0')}:00`
                );
                
                const todayStr = getCurrentLocalDate();
                const isToday = date === todayStr;
                
                // Obtener reservas existentes de la trabajadora
                const bookings = await getBookingsByDateAndWorker(date, worker.id);
                
                // Filtrar slots disponibles
                let availableSlots = baseSlots.filter(slotStartStr => {
                    const slotStart = timeToMinutes(slotStartStr);
                    const slotEnd = slotStart + service.duracion;

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
                console.log(`✅ Slots disponibles para ${worker.nombre} el ${date}:`, availableSlots);
                setSlots(availableSlots);
            } catch (err) {
                console.error(err);
                setError("Error al cargar horarios");
            } finally {
                setLoading(false);
            }
        };

        loadSlots();
    }, [service, date, worker, horariosTrabajadora, diaTrabaja, verificacionCompleta]);

    if (!service || !date || !worker) return null;

    // Mostrar estado de carga mientras se verifica
    if (!verificacionCompleta) {
        return (
            <div className="space-y-4 animate-fade-in">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <div className="icon-clock text-pink-500"></div>
                    3. Elegí un horario con {worker.nombre}
                </h2>
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                </div>
            </div>
        );
    }

    // Si no trabaja este día
    if (!diaTrabaja) {
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
                        No hay horarios disponibles para {worker.nombre} el {new Date(date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Probá con otra fecha o verificá la configuración de horas</p>
                </div>
            ) : (
                <>
                    <div className="text-sm bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-700">
                            <div className="icon-clock text-blue-500"></div>
                            <span className="font-medium">
                                Horarios disponibles de {worker.nombre} para {new Date(date).toLocaleDateString()}:
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