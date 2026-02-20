// components/ServiceSelection.js - Bennet Salon

function ServiceSelection({ onSelect, selectedService }) {
    const services = [
        { 
            id: 1, 
            name: "💅 Esmaltado + Manicura Macro con Cera", 
            duration: 75,
            price: "3.5 - 5",
            description: "Incluye esmaltado común o semipermanente según elección"
        },
        { 
            id: 2, 
            name: "✨ Sistema Press On + Manicura Macro con Cera", 
            duration: 120,
            price: "6 - 7",
            description: "Precio según complejidad del diseño"
        },
        { 
            id: 3, 
            name: "💪 Builder Gel + Manicura Macro con Cera", 
            duration: 150,
            price: "6.5 - 7.5",
            description: "Para fortalecer y alargar uñas naturales"
        },
        { 
            id: 4, 
            name: "🦶 Pedicura Spa + Esmaltado", 
            duration: 120,
            price: "6.5 - 10",
            description: "Incluye exfoliación, hidratación, masaje y esmaltado"
        },
        { 
            id: 5, 
            name: "💖 Gel Semipermanente + Manicura Macro con Cera", 
            duration: 90,
            price: "4.5 - 6",
            description: "Esmaltado semipermanente de larga duración"
        },
        { 
            id: 6, 
            name: "✨ Gel Semi Transparente + Manicura Macro con Cera", 
            duration: 90,
            price: "5 - 6.5",
            description: "Acabado natural y brillante con gel transparente"
        }
    ];

    return (
        <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <div className="icon-wand text-pink-500"></div>
                1. Elegí tu servicio
            </h2>
            <div className="grid grid-cols-1 gap-3">
                {services.map(service => (
                    <button
                        key={service.id}
                        onClick={() => onSelect(service)}
                        className={`
                            p-4 rounded-xl border text-left transition-all duration-200 
                            ${selectedService?.id === service.id 
                                ? 'border-pink-500 bg-pink-50 ring-1 ring-pink-500 shadow-md' 
                                : 'border-gray-200 bg-white hover:border-pink-300 hover:shadow-sm'}
                        `}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <span className="font-medium text-gray-900 text-lg block">
                                    {service.name}
                                </span>
                                {service.description && (
                                    <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-pink-600 font-bold text-lg">
                                    ${service.price}
                                </span>
                                <span className="flex items-center text-gray-500 text-xs bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                    <div className="icon-clock text-xs mr-1"></div>
                                    {service.duration} min
                                </span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
            
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200 mt-4">
                <p className="font-medium mb-1">📌 Notas importantes:</p>
                <p>• El precio incluye únicamente decoración sencilla</p>
                <p>• El costo puede variar en dependencia del estado de las uñas</p>
                <p>• <strong>Horarios disponibles: 8:00 AM y 2:00 PM</strong></p>
            </div>
        </div>
    );
}