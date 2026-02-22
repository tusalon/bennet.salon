// components/admin/ConfigPanel.js - VERSIÓN RESPONSIVE

function ConfigPanel() {
    const [config, setConfig] = React.useState(window.salonConfig?.get() || {});
    const [dias] = React.useState(['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']);
    const [diasNombres] = React.useState({
        lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
        jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo'
    });

    const handleGuardar = () => {
        window.salonConfig.guardar(config);
        alert('✅ Configuración guardada');
    };

    const toggleDia = (dia) => {
        setConfig({
            ...config,
            horarios: {
                ...config.horarios,
                [dia]: {
                    ...config.horarios[dia],
                    activo: !config.horarios[dia]?.activo
                }
            }
        });
    };

    const actualizarHorario = (dia, bloque, campo, valor) => {
        setConfig({
            ...config,
            horarios: {
                ...config.horarios,
                [dia]: {
                    ...config.horarios[dia],
                    [bloque]: {
                        ...config.horarios[dia]?.[bloque],
                        [campo]: valor
                    }
                }
            }
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-6">⚙️ Configuración del Salón</h2>
            
            <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-lg">📅 Horarios de Atención</h3>
                
                {dias.map(dia => (
                    <div key={dia} className="border rounded-lg p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-3">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={config.horarios?.[dia]?.activo || false}
                                    onChange={() => toggleDia(dia)}
                                    className="w-4 h-4 text-pink-600"
                                />
                                <span className="font-medium text-sm sm:text-base">{diasNombres[dia]}</span>
                            </label>
                        </div>
                        
                        {config.horarios?.[dia]?.activo && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 ml-0 sm:ml-6">
                                <div className="space-y-2">
                                    <label className="text-xs sm:text-sm text-gray-600">Mañana</label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="time"
                                            value={config.horarios[dia]?.manana?.desde || '09:00'}
                                            onChange={(e) => actualizarHorario(dia, 'manana', 'desde', e.target.value)}
                                            className="border rounded px-2 py-1 text-sm w-full sm:w-auto"
                                        />
                                        <span className="text-gray-400 hidden sm:inline">a</span>
                                        <input
                                            type="time"
                                            value={config.horarios[dia]?.manana?.hasta || '12:00'}
                                            onChange={(e) => actualizarHorario(dia, 'manana', 'hasta', e.target.value)}
                                            className="border rounded px-2 py-1 text-sm w-full sm:w-auto"
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-xs sm:text-sm text-gray-600">Tarde</label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="time"
                                            value={config.horarios[dia]?.tarde?.desde || '13:00'}
                                            onChange={(e) => actualizarHorario(dia, 'tarde', 'desde', e.target.value)}
                                            className="border rounded px-2 py-1 text-sm w-full sm:w-auto"
                                        />
                                        <span className="text-gray-400 hidden sm:inline">a</span>
                                        <input
                                            type="time"
                                            value={config.horarios[dia]?.tarde?.hasta || '18:00'}
                                            onChange={(e) => actualizarHorario(dia, 'tarde', 'hasta', e.target.value)}
                                            className="border rounded px-2 py-1 text-sm w-full sm:w-auto"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duración por defecto (min)
                    </label>
                    <input
                        type="number"
                        value={config.duracionTurnos || 60}
                        onChange={(e) => setConfig({...config, duracionTurnos: parseInt(e.target.value)})}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        min="15"
                        step="15"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Intervalo entre turnos (min)
                    </label>
                    <input
                        type="number"
                        value={config.intervaloEntreTurnos || 0}
                        onChange={(e) => setConfig({...config, intervaloEntreTurnos: parseInt(e.target.value)})}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        min="0"
                        step="5"
                    />
                </div>
            </div>
            
            <button
                onClick={handleGuardar}
                className="w-full sm:w-auto bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition"
            >
                Guardar Configuración
            </button>
        </div>
    );
}