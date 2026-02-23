// components/ClientAuthScreen.js - VERSIÓN CON ACCESO PARA TRABAJADORAS

function ClientAuthScreen({ onAccessGranted }) {
    const [nombre, setNombre] = React.useState('');
    const [whatsapp, setWhatsapp] = React.useState('');
    const [solicitudEnviada, setSolicitudEnviada] = React.useState(false);
    const [error, setError] = React.useState('');
    const [clienteAutorizado, setClienteAutorizado] = React.useState(null);
    const [verificando, setVerificando] = React.useState(false);
    const [yaTieneSolicitud, setYaTieneSolicitud] = React.useState(false);
    const [estadoRechazado, setEstadoRechazado] = React.useState(false);
    // 🔥 NUEVO: Estado para detectar si es trabajadora
    const [esTrabajadora, setEsTrabajadora] = React.useState(false);
    const [trabajadoraInfo, setTrabajadoraInfo] = React.useState(null);

    const verificarNumero = async (numero) => {
        if (numero.length < 8) {
            setClienteAutorizado(null);
            setYaTieneSolicitud(false);
            setEstadoRechazado(false);
            setEsTrabajadora(false);
            setTrabajadoraInfo(null);
            setError('');
            return;
        }
        
        setVerificando(true);
        
        const numeroLimpio = numero.replace(/\D/g, '');
        const numeroCompleto = `53${numeroLimpio}`;
        
        try {
            console.log('🔍 Verificando número:', numeroCompleto);
            
            // 🔥 PASO 1: Verificar si es trabajadora (NUEVO)
            if (window.verificarTrabajadoraPorTelefono) {
                const trabajadora = await window.verificarTrabajadoraPorTelefono(numeroLimpio);
                console.log('👩‍🎨 ¿Es trabajadora?', trabajadora);
                
                if (trabajadora) {
                    setEsTrabajadora(true);
                    setTrabajadoraInfo(trabajadora);
                    setClienteAutorizado(null);
                    setYaTieneSolicitud(false);
                    setError('🔐 Acceso como trabajadora detectado. Hacé clic en "Ingresar como trabajadora".');
                    setVerificando(false);
                    return;
                }
            }
            
            // PASO 2: Si no es trabajadora, verificar si está autorizado como cliente
            const existe = await window.verificarAccesoCliente(numeroCompleto);
            console.log('📋 Resultado autorizado:', existe);
            
            if (existe) {
                setClienteAutorizado(existe);
                setEsTrabajadora(false);
                setTrabajadoraInfo(null);
                setYaTieneSolicitud(false);
                setEstadoRechazado(false);
                setError('');
            } else {
                setClienteAutorizado(null);
                setEsTrabajadora(false);
                setTrabajadoraInfo(null);
                
                // Obtener estado de solicitud si existe
                if (window.obtenerEstadoSolicitud) {
                    const estado = await window.obtenerEstadoSolicitud(numeroCompleto);
                    console.log('📋 Estado de solicitud:', estado);
                    
                    if (estado && estado.existe) {
                        
                        if (estado.estado === 'pendiente') {
                            setYaTieneSolicitud(true);
                            setEstadoRechazado(false);
                            setError('Ya tenés una solicitud pendiente. El dueño te contactará pronto.');
                        } 
                        else if (estado.estado === 'rechazado') {
                            setYaTieneSolicitud(false); // Permitir reenvío
                            setEstadoRechazado(true);
                            setError('Tu solicitud anterior fue rechazada. Podés volver a intentarlo.');
                        }
                        else {
                            setYaTieneSolicitud(true);
                            setEstadoRechazado(false);
                            setError('Este número ya fue registrado. Contactá al dueño si tenés dudas.');
                        }
                    } else {
                        setYaTieneSolicitud(false);
                        setEstadoRechazado(false);
                        setError('');
                    }
                }
            }
        } catch (err) {
            console.error('Error verificando:', err);
        } finally {
            setVerificando(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!nombre.trim() || !whatsapp.trim()) {
            setError('Completá todos los campos');
            return;
        }
        
        setVerificando(true);
        
        const numeroLimpio = whatsapp.replace(/\D/g, '');
        const numeroCompleto = `53${numeroLimpio}`;
        
        try {
            // Verificar si ya está autorizado como cliente
            const autorizado = await window.verificarAccesoCliente(numeroCompleto);
            
            if (autorizado) {
                console.log('✅ Acceso directo para:', autorizado);
                onAccessGranted(autorizado.nombre, numeroCompleto);
                return;
            }
            
            // Agregar solicitud (ahora maneja rechazados automáticamente)
            const agregado = await window.agregarClientePendiente(nombre, numeroCompleto);
            
            if (agregado) {
                setSolicitudEnviada(true);
                setError('');
            }
        } catch (err) {
            console.error('Error en submit:', err);
            setError('Error en el sistema. Intentá más tarde.');
        } finally {
            setVerificando(false);
        }
    };

    // 🔥 NUEVO: Función para acceso de trabajadora
    const handleAccesoTrabajadora = () => {
        if (trabajadoraInfo) {
            console.log('👩‍🎨 Accediendo como trabajadora:', trabajadoraInfo);
            
            // Guardar sesión de trabajadora
            localStorage.setItem('trabajadoraAuth', JSON.stringify({
                id: trabajadoraInfo.id,
                nombre: trabajadoraInfo.nombre,
                telefono: trabajadoraInfo.telefono
            }));
            
            // Redirigir al panel de admin
            window.location.href = 'admin.html';
        }
    };

    const handleAccesoDirecto = () => {
        if (clienteAutorizado) {
            const numeroLimpio = whatsapp.replace(/\D/g, '');
            const numeroCompleto = `53${numeroLimpio}`;
            onAccessGranted(clienteAutorizado.nombre, numeroCompleto);
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
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="icon-shield-check text-3xl text-pink-600"></div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">Bennet Salon</h1>
                    <p className="text-gray-500 mt-2">Acceso para clientes y trabajadoras</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-xl border border-pink-100">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <div className="icon-user-plus text-pink-500"></div>
                        Ingresá con tu número
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tu nombre completo (solo para clientes)
                            </label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition"
                                placeholder="Ej: María García"
                                disabled={esTrabajadora}
                            />
                            {esTrabajadora && (
                                <p className="text-xs text-blue-600 mt-1">
                                    ⚡ Las trabajadoras no necesitan nombre
                                </p>
                            )}
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
                                        verificarNumero(value);
                                    }}
                                    className="w-full px-4 py-3 rounded-r-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition"
                                    placeholder="Ej: 54066204"
                                    required
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Ingresá solo los números después del +53</p>
                        </div>

                        {verificando && (
                            <div className="text-blue-600 text-sm bg-blue-50 p-2 rounded-lg flex items-center gap-2">
                                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                Verificando...
                            </div>
                        )}

                        {/* 🔥 NUEVO: Banner para trabajadora */}
                        {esTrabajadora && trabajadoraInfo && !verificando && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 animate-fade-in">
                                <div className="flex items-start gap-3">
                                    <div className="icon-briefcase text-purple-600 text-xl"></div>
                                    <div className="flex-1">
                                        <p className="text-purple-800 font-medium">
                                            ¡Hola <strong>{trabajadoraInfo.nombre}</strong>!
                                        </p>
                                        <p className="text-purple-600 text-sm mt-1">
                                            Detectamos que sos trabajadora de Bennet Salon.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {clienteAutorizado && !verificando && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-fade-in">
                                <div className="flex items-start gap-3">
                                    <div className="icon-check-circle text-green-600 text-xl"></div>
                                    <div className="flex-1">
                                        <p className="text-green-800 font-medium">
                                            ¡Hola <strong>{clienteAutorizado.nombre}</strong>! Ya tenés acceso.
                                        </p>
                                        <p className="text-green-600 text-sm mt-1">
                                            Hacé clic en el botón de abajo para ingresar.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && !esTrabajadora && (
                            <div className={`text-sm p-3 rounded-lg flex items-start gap-2 ${
                                estadoRechazado 
                                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' 
                                    : 'bg-red-50 text-red-600'
                            }`}>
                                <div className={`${estadoRechazado ? 'icon-alert-circle' : 'icon-triangle-alert'} mt-0.5`}></div>
                                {error}
                            </div>
                        )}

                        {yaTieneSolicitud && !clienteAutorizado && !verificando && !estadoRechazado && !esTrabajadora && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-yellow-700 text-sm">
                                    Este número ya fue registrado y está pendiente de aprobación.
                                </p>
                            </div>
                        )}

                        {/* 🔥 BOTONES DE ACCIÓN */}
                        <div className="space-y-3">
                            {clienteAutorizado && !verificando && (
                                <button
                                    type="button"
                                    onClick={handleAccesoDirecto}
                                    className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition transform hover:scale-105 flex items-center justify-center gap-2"
                                >
                                    <div className="icon-log-in"></div>
                                    Ingresar como Cliente
                                </button>
                            )}

                            {esTrabajadora && trabajadoraInfo && !verificando && (
                                <button
                                    type="button"
                                    onClick={handleAccesoTrabajadora}
                                    className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition transform hover:scale-105 flex items-center justify-center gap-2"
                                >
                                    <div className="icon-briefcase"></div>
                                    Ingresar como Trabajadora
                                </button>
                            )}

                            {!clienteAutorizado && !esTrabajadora && !verificando && (
                                <button
                                    type="submit"
                                    disabled={verificando || (yaTieneSolicitud && !estadoRechazado)}
                                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-xl font-bold hover:from-pink-600 hover:to-purple-600 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {verificando ? 'Verificando...' : 'Solicitar Acceso como Cliente'}
                                </button>
                            )}
                        </div>
                    </form>

                    <div className="mt-6 text-xs text-center text-gray-400 border-t pt-4">
                        <p className="mb-2">¿Sos trabajadora?</p>
                        <p>Ingresá tu número de teléfono y aparecerá la opción para acceder directamente al panel.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}