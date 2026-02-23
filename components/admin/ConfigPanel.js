// components/admin/ConfigPanel.js - Versión con horarios por trabajadora (con modo restringido)

function ConfigPanel({ trabajadoraId, modoRestringido }) {
    const [trabajadoras, setTrabajadoras] = React.useState([]);
    const [trabajadoraSeleccionada, setTrabajadoraSeleccionada] = React.useState(null);
    const [horarios, setHorarios] = React.useState({});
    const [configGlobal, setConfigGlobal] = React.useState({});
    const [cargando, setCargando] = React.useState(true);

    const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const diasNombres = {
        lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
        jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo'
    };

    // Generar horas disponibles (0-23)
    const horas = Array.from({ length: 24 }, (_, i) => ({
        value: i,
        label: `${i.toString().padStart(2, '0')}:00`
    }));

    React.useEffect(() => {
        cargarDatos();
    }, []);

    React.useEffect(() => {
        // Si está en modo restringido, forzar selección de la trabajadora actual
        if (modoRestringido && trabajadoraId) {
            setTrabajadoraSeleccionada(trabajadoraId);
        }
    }, [modoRestringido, trabajadoraId]);

    const cargarDatos = async () => {
        setCargando(true);
        try {
            // Cargar trabajadoras
            if (window.salonTrabajadoras) {
                const lista = await window.salonTrabajadoras.getAll(true);
                setTrabajadoras(lista || []);
                
                // Si no está en modo restringido, seleccionar primera por defecto
                if (!modoRestringido && lista && lista.length > 0) {
                    setTrabajadoraSeleccionada(lista[0].id);
                }
            }
            
            // Cargar configuración global (solo si no está en modo restringido)
            if (!modoRestringido && window.salonConfig) {
                const config = await window.salonConfig.get();
                setConfigGlobal(config || {});
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setCargando(false);
        }
    };

    React.useEffect(() => {
        if (trabajadoraSeleccionada) {
            cargarHorariosTrabajadora(trabajadoraSeleccionada);
        }
    }, [trabajadoraSeleccionada]);

    const cargarHorariosTrabajadora = async (id) => {
        try {
            const horariosTrabajadora = await window.salonConfig.getHorariosTrabajadora(id);
            setHorarios(prev => ({
                ...prev,
                [id]: horariosTrabajadora
            }));
        } catch (error) {
            console.error('Error cargando horarios:', error);
        }
    };

    const toggleDia = (dia) => {
        if (!trabajadoraSeleccionada) return;
        
        const horariosActuales = horarios[trabajadoraSeleccionada] || { horas: [], dias: [] };
        const diasActuales = horariosActuales.dias || [];
        
        const nuevosDias = diasActuales.includes(dia)
            ? diasActuales.filter(d => d !== dia)
            : [...diasActuales, dia];
        
        setHorarios({
            ...horarios,
            [trabajadoraSeleccionada]: {
                ...horariosActuales,
                dias: nuevosDias
            }
        });
    };

    const toggleHora = (hora) => {
        if (!trabajadoraSeleccionada) return;
        
        const horariosActuales = horarios[trabajadoraSeleccionada] || { horas: [], dias: [] };
        const horasActuales = horariosActuales.horas || [];
        
        const nuevasHoras = horasActuales.includes(hora)
            ? horasActuales.filter(h => h !== hora)
            : [...horasActuales, hora].sort((a, b) => a - b);
        
        setHorarios({
            ...horarios,
            [trabajadoraSeleccionada]: {
                ...horariosActuales,
                horas: nuevasHoras
            }
        });
    };

    const handleGuardarConfigGlobal = async () => {
        if (modoRestringido) return; // No permitir en modo restringido
        
        try {
            await window.salonConfig.guardar(configGlobal);
            alert('✅ Configuración global guardada');
        } catch (error) {
            alert('Error al guardar configuración global');
        }
    };

    const handleGuardarHorariosTrabajadora = async () => {
        if (!trabajadoraSeleccionada) return;
        
        try {
            const horariosAGuardar = horarios[trabajadoraSeleccionada] || { horas: [], dias: [] };
            await window.salonConfig.guardarHorariosTrabajadora(
                trabajadoraSeleccionada, 
                horariosAGuardar
            );
            alert('✅ Horarios guardados para la trabajadora');
        } catch (error) {
            alert('Error al guardar horarios');
        }
    };

    if (cargando) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Cargando configuración...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-6">
                {modoRestringido ? '⚙️ Mi Configuración' : '⚙️ Configuración del Salón'}
            </h2>
            
            {/* Configuración Global - Solo visible si NO está en modo restringido */}
            {!modoRestringido && (
                <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
                    <h3 className="font-semibold text-lg mb-4">⚙️ Configuración General</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duración por defecto (min)
                            </label>
                            <input
                                type="number"
                                value={configGlobal.duracionTurnos || 60}
                                onChange={(e) => setConfigGlobal({
                                    ...configGlobal, 
                                    duracionTurnos: parseInt(e.target.value)
                                })}
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
                                value={configGlobal.intervaloEntreTurnos || 0}
                                onChange={(e) => setConfigGlobal({
                                    ...configGlobal, 
                                    intervaloEntreTurnos: parseInt(e.target.value)
                                })}
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                min="0"
                                step="5"
                            />
                        </div>
                    </div>
                    
                    <div className="mb-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={configGlobal.modo24h || false}
                                onChange={(e) => setConfigGlobal({
                                    ...configGlobal, 
                                    modo24h: e.target.checked
                                })}
                                className="w-5 h-5 text-pink-600"
                            />
                            <span className="text-sm text-gray-700">Modo 24 horas</span>
                        </label>
                    </div>
                    
                    <button
                        onClick={handleGuardarConfigGlobal}
                        className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition text-sm"
                    >
                        Guardar Configuración Global
                    </button>
                </div>
            )}
            
            {/* Selector de trabajadora - Solo visible si NO está en modo restringido */}
            {!modoRestringido && (
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seleccionar Trabajadora
                    </label>
                    <select
                        value={trabajadoraSeleccionada || ''}
                        onChange={(e) => setTrabajadoraSeleccionada(parseInt(e.target.value))}
                        className="w-full border rounded-lg px-3 py-2"
                    >
                        <option value="">Seleccione una trabajadora</option>
                        {trabajadoras.map(t => (
                            <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                    </select>
                </div>
            )}
            
            {/* En modo restringido, mostrar mensaje */}
            {modoRestringido && (
                <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                        <div className="icon-info"></div>
                        <span>Estás configurando tus propios horarios de trabajo</span>
                    </div>
                </div>
            )}
            
            {/* Horarios por trabajadora */}
            {trabajadoraSeleccionada && (
                <div className="space-y-6">
                    <h3 className="font-semibold text-lg">
                        📅 Horarios de {
                            modoRestringido 
                                ? 'mi trabajo'
                                : trabajadoras.find(t => t.id === trabajadoraSeleccionada)?.nombre
                        }
                    </h3>
                    
                    {/* Días de la semana */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-700">Días laborales</h4>
                        <div className="flex flex-wrap gap-2">
                            {dias.map(dia => {
                                const activo = horarios[trabajadoraSeleccionada]?.dias?.includes(dia) || false;
                                return (
                                    <button
                                        key={dia}
                                        onClick={() => toggleDia(dia)}
                                        className={`
                                            px-3 py-2 rounded-lg text-sm font-medium transition
                                            ${activo 
                                                ? 'bg-pink-600 text-white shadow-md' 
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                                        `}
                                    >
                                        {diasNombres[dia]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    
                    {/* Horas disponibles */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-700">Horas disponibles</h4>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                            {horas.map(hora => {
                                const activa = horarios[trabajadoraSeleccionada]?.horas?.includes(hora.value) || false;
                                return (
                                    <button
                                        key={hora.value}
                                        onClick={() => toggleHora(hora.value)}
                                        className={`
                                            px-2 py-1 text-xs font-medium rounded transition-all
                                            ${activa 
                                                ? 'bg-pink-600 text-white shadow-md hover:bg-pink-700' 
                                                : 'bg-white border border-gray-300 text-gray-700 hover:border-pink-400 hover:bg-pink-50'}
                                        `}
                                    >
                                        {hora.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    
                    <button
                        onClick={handleGuardarHorariosTrabajadora}
                        className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition"
                    >
                        Guardar {modoRestringido ? 'Mis Horarios' : `Horarios de ${trabajadoras.find(t => t.id === trabajadoraSeleccionada)?.nombre}`}
                    </button>
                </div>
            )}
        </div>
    );
}