// components/ClientAuthScreen.js - Pantalla de solicitud de acceso

function ClientAuthScreen({ onAccessGranted }) {
    const [nombre, setNombre] = React.useState('');
    const [whatsapp, setWhatsapp] = React.useState('');
    const [solicitudEnviada, setSolicitudEnviada] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!nombre.trim() || !whatsapp.trim()) {
            setError('Completá todos los campos');
            return;
        }
        
        const numeroLimpio = whatsapp.replace(/\D/g, '');
        const numeroCompleto = `53${numeroLimpio}`;
        
        // Verificar si ya está autorizado
        if (isClienteAutorizado(numeroCompleto)) {
            // Si ya está autorizado, accede directamente
            onAccessGranted(nombre, numeroCompleto);
            return;
        }
        
        // Verificar si ya tiene solicitud pendiente
        if (isClientePendiente(numeroCompleto)) {
            setError('Ya tenés una solicitud pendiente. El dueño te contactará pronto.');
            return;
        }
        
        // Agregar a pendientes y notificar al admin
        const agregado = agregarClientePendiente(nombre, numeroCompleto);
        
        if (agregado) {
            setSolicitudEnviada(true);
            setError('');
        } else {
            setError('Error al enviar la solicitud. Intentá de nuevo.');
        }
    };

    if (solicitudEnviada) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <div className="icon-check text-5xl text-green-600"></div>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 mb-3">¡Solicitud Enviada!</h2>
                
                <div className="bg-white p-6 rounded-2xl shadow-lg max-w-md mb-6 border border-pink-100">
                    <p className="text-gray-600 mb-4">
                        Gracias por querer ser parte de <span className="font-bold text-pink-600">Bennet Salon</span>
                    </p>
                    
                    <div className="bg-pink-50 p-4 rounded-xl text-left space-y-2 mb-4">
                        <p className="text-sm text-gray-700">
                            <span className="font-semibold">📱 Tu número:</span> +{whatsapp}
                        </p>
                        <p className="text-sm text-gray-700">
                            <span className="font-semibold">👤 Nombre:</span> {nombre}
                        </p>
                    </div>
                    
                    <p className="text-gray-500 text-sm">
                        El dueño revisará tu solicitud y te contactará por WhatsApp para confirmar tu acceso.
                    </p>
                </div>
                
                <div className="text-sm text-gray-400">
                    <p>Mientras tanto, podés contactarnos:</p>
                    <a href="https://wa.me/5354066204" target="_blank" className="text-pink-600 font-medium inline-flex items-center gap-1 mt-2">
                        <div className="icon-message-circle"></div>
                        +53 54066204
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="max-w-md w-full">
                {/* Logo o título */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="icon-shield-check text-3xl text-pink-600"></div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">Bennet Salon</h1>
                    <p className="text-gray-500 mt-2">Acceso exclusivo para clientes</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-xl border border-pink-100">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <div className="icon-user-plus text-pink-500"></div>
                        Solicitar acceso
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tu nombre completo
                            </label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition"
                                placeholder="Ej: María García"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tu WhatsApp
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
                                    className="w-full px-4 py-3 rounded-r-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition"
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
                            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-xl font-bold hover:from-pink-600 hover:to-purple-600 transition transform hover:scale-105"
                        >
                            Solicitar Acceso
                        </button>
                    </form>

                    <div className="mt-6 text-xs text-center text-gray-400">
                        <p>¿Ya tenés acceso?</p>
                        <p className="mt-1">Contactanos por WhatsApp para verificar</p>
                    </div>
                </div>
            </div>
        </div>
    );
}