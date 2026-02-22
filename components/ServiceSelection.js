// components/ServiceSelection.js - Versión dinámica (usa datos de Supabase)

function ServiceSelection({ onSelect, selectedService }) {
    const [services, setServices] = React.useState([]);
    const [cargando, setCargando] = React.useState(true);

    React.useEffect(() => {
        cargarServicios();
    }, []);

    const cargarServicios = () => {
        setCargando(true);
        try {
            // Obtener servicios activos desde window.salonServicios
            if (window.salonServicios) {
                const serviciosActivos = window.salonServicios.getAll(true);
                console.log('📋 Servicios cargados:', serviciosActivos);
                setServices(serviciosActivos);
            } else {
                // Fallback a servicios por defecto
                setServices([
                    { id: 1, name: "💅 Esmaltado + Manicura", duration: 75, price: "3.5 - 5" },
                    { id: 2, name: "✨ Sistema Press On", duration: 120, price: "6 - 7" },
                ]);
            }
        } catch (error) {
            console.error('Error cargando servicios:', error);
        } finally {
            setCargando(false);
        }
    };

    if (cargando) {
        return (
            <div className="space-y-4 animate-fade-in">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <div className="icon-wand text-pink-500"></div>
                    1. Elegí tu servicio
                </h2>
                <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-b-2 border-pink-600 rounded-full mx-auto"></div>
                    <p className="text-gray-500 mt-4">Cargando servicios...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <div className="icon-wand text-pink-500"></div>
                1. Elegí tu servicio
            </h2>
            
            {services.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-gray-500">No hay servicios disponibles</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {services.map(service => (
                        <button
                            key={service.id}
                            onClick={() => onSelect(service)}
                            className={`
                                p-4 rounded-xl border text-left transition-all duration-200 
                                ${selectedService?.id === service.id 
                                    ? 'border-pink-500 bg-pink-50 ring-1 ring-pink-500 shadow-md scale-[1.02]' 
                                    : 'border-gray-200 bg-white hover:border-pink-300 hover:shadow-sm hover:scale-[1.01]'}
                                transform transition-all
                            `}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <span className="font-medium text-gray-900 text-lg block">
                                        {service.nombre || service.name}
                                    </span>
                                    {service.descripcion && (
                                        <p className="text-sm text-gray-500 mt-1">{service.descripcion}</p>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-pink-600 font-bold text-lg">
                                        ${service.precioMin || service.price} - ${service.precioMax || service.price}
                                    </span>
                                    <span className="flex items-center text-gray-500 text-xs bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                        <div className="icon-clock text-xs mr-1"></div>
                                        {service.duracion} min
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
            
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200 mt-4">
                <p className="font-medium mb-1">📌 Notas importantes:</p>
                <p>• El precio incluye únicamente decoración sencilla</p>
                <p>• El costo puede variar en dependencia del estado de las uñas</p>
                <p>• <strong>Horarios disponibles: 8:00 AM y 2:00 PM</strong></p>
            </div>
        </div>
    );
}