// components/Calendar.js - VERSIÓN CORREGIDA (sin problemas de zona horaria)

function Calendar({ onDateSelect, selectedDate }) {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    
    // Función para obtener fecha en formato YYYY-MM-DD
    const formatDate = (date) => {
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    // ✅ CORREGIDO: Obtener fecha local sin problemas de zona horaria
    const getTodayLocalString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Verificar si una fecha NO está disponible
    const isPastDate = (date) => {
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayStr = getTodayLocalString();
        const dateStr = formatDate(date);
        
        // Caso 1: Fechas anteriores a hoy
        if (date < today) return true;
        
        // Caso 2: Es HOY - verificar si ya pasó el horario del último turno
        if (dateStr === todayStr) {
            const currentHour = now.getHours();
            const currentMinutes = now.getMinutes();
            
            // Último turno empieza a las 5:30 PM (17:30)
            const LAST_SLOT_HOUR = 17;
            const LAST_SLOT_MINUTES = 30;
            
            if (currentHour > LAST_SLOT_HOUR) return true;
            if (currentHour === LAST_SLOT_HOUR && currentMinutes > LAST_SLOT_MINUTES) return true;
        }
        
        return false;
    };

    // Verificar si es DOMINGO (cerrado)
    const isSunday = (date) => {
        return date.getDay() === 0;
    };

    // Navegación
    const nextMonth = () => {
        const next = new Date(currentDate);
        next.setMonth(currentDate.getMonth() + 1);
        setCurrentDate(next);
    };

    const prevMonth = () => {
        const prev = new Date(currentDate);
        prev.setMonth(currentDate.getMonth() - 1);
        setCurrentDate(prev);
    };

    // Generar días del mes
    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const days = [];
        
        // Días vacíos al inicio (para alinear con día de la semana)
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }
        
        // Días del mes
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }
        
        return days;
    };

    const days = getDaysInMonth();
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    // Verificar si hoy ya pasó el último turno
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const isAfterLastSlot = (currentHour > 17) || (currentHour === 17 && currentMinutes > 30);

    return (
        <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <div className="icon-calendar text-pink-500"></div>
                2. Seleccioná una fecha
            </h2>
            
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Header del calendario */}
                <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-100">
                    <button 
                        onClick={prevMonth} 
                        className="p-2 hover:bg-white rounded-full transition-colors text-gray-600"
                        title="Mes anterior"
                    >
                        <div className="icon-chevron-left"></div>
                    </button>
                    <span className="font-bold text-gray-800 text-lg capitalize">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <button 
                        onClick={nextMonth} 
                        className="p-2 hover:bg-white rounded-full transition-colors text-gray-600"
                        title="Mes siguiente"
                    >
                        <div className="icon-chevron-right"></div>
                    </button>
                </div>

                {/* Grid de días */}
                <div className="p-4">
                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 mb-2 text-center">
                        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                            <div 
                                key={i} 
                                className={`text-xs font-medium py-1 ${d === 'D' ? 'text-red-400' : 'text-gray-400'}`}
                            >
                                {d}
                            </div>
                        ))}
                    </div>
                    
                    {/* Días del mes */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((date, idx) => {
                            if (!date) {
                                return <div key={idx} className="h-10" />;
                            }

                            const dateStr = formatDate(date);
                            const past = isPastDate(date);
                            const sunday = isSunday(date);
                            const selected = selectedDate === dateStr;
                            
                            const available = !past && !sunday;
                            
                            let className = "h-10 w-full flex items-center justify-center rounded-lg text-sm font-medium transition-all relative";
                            
                            if (selected) {
                                className += " bg-gray-900 text-white shadow-md scale-105";
                            } else if (!available) {
                                className += " text-gray-300 cursor-not-allowed bg-gray-50";
                            } else {
                                className += " text-gray-700 hover:bg-pink-50 hover:text-pink-600 cursor-pointer";
                            }
                            
                            let title = "";
                            if (past && dateStr === getTodayLocalString()) {
                                title = "Hoy ya no hay horarios disponibles (último turno 5:30 PM)";
                            } else if (past) {
                                title = "Fecha pasada";
                            } else if (sunday) {
                                title = "Domingo cerrado";
                            }
                            
                            return (
                                <button
                                    key={idx}
                                    onClick={() => available && onDateSelect(dateStr)}
                                    disabled={!available}
                                    className={className}
                                    title={title}
                                >
                                    {date.getDate()}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Mensaje informativo */}
            <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2">
                    <div className="icon-info text-blue-500 text-lg"></div>
                    <span>
                        <strong>📅 Días disponibles:</strong> Lunes a Sábado<br />
                        <span className="text-xs">
                            ⏰ Horarios: 9 AM - 12 PM | 1 PM - 5:30 PM (último turno)<br />
                            {isAfterLastSlot ? (
                                <span className="text-red-500 font-medium">
                                    🔴 Hoy ya no se puede reservar (pasaron las 5:30 PM)
                                </span>
                            ) : (
                                <span className="text-green-500">
                                    ✅ Hoy hay disponibilidad hasta las 5:30 PM
                                </span>
                            )}
                        </span>
                    </span>
                </div>
            </div>
        </div>
    );
}