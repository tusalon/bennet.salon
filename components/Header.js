// components/Header.js - Bennet Salon (con botón de admin mejorado)

function Header({ cliente, onLogout }) {
    const [mostrarOpcionesAdmin, setMostrarOpcionesAdmin] = React.useState(false);
    
    const goToAdmin = () => {
        const isAuth = localStorage.getItem('adminAuth') === 'true';
        const trabajadoraAuth = localStorage.getItem('trabajadoraAuth');
        
        if (isAuth || trabajadoraAuth) {
            // Si ya hay sesión, va directo
            window.location.href = 'admin.html';
        } else {
            // Si no, va al login
            window.location.href = 'admin-login.html';
        }
    };

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600">
                        <div className="icon-sparkles text-lg"></div>
                    </div>
                    <h1 className="text-xl font-bold text-gray-800">Bennet Salon</h1>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Nombre del cliente si está autorizado */}
                    {cliente && (
                        <div className="hidden sm:flex items-center gap-1 text-sm text-gray-600">
                            <div className="icon-user-check text-green-500"></div>
                            <span className="font-medium">{cliente.nombre}</span>
                        </div>
                    )}
                    
                    {/* 🔥 BOTÓN DE ADMIN MEJORADO */}
                    <div className="relative">
                        <button
                            onClick={goToAdmin}
                            className="flex items-center gap-2 bg-gray-100 hover:bg-pink-100 px-3 py-2 rounded-full transition-all transform hover:scale-105 border border-gray-200 shadow-sm"
                            title="Panel de Administración"
                            onMouseEnter={() => setMostrarOpcionesAdmin(true)}
                            onMouseLeave={() => setMostrarOpcionesAdmin(false)}
                        >
                            <div className="icon-shield-check text-gray-600 group-hover:text-pink-600"></div>
                            <span className="text-sm font-medium text-gray-700 hidden sm:inline">Admin</span>
                            
                            {/* Indicador de sesión activa */}
                            {(localStorage.getItem('adminAuth') === 'true' || localStorage.getItem('trabajadoraAuth')) && (
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            )}
                        </button>
                        
                        {/* Tooltip informativo */}
                        {mostrarOpcionesAdmin && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 p-2 text-xs text-gray-600 z-50">
                                {localStorage.getItem('adminAuth') === 'true' ? (
                                    <p>✅ Sesión de admin activa</p>
                                ) : localStorage.getItem('trabajadoraAuth') ? (
                                    <p>✅ Sesión de trabajadora activa</p>
                                ) : (
                                    <p>🔐 Acceder al panel</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Botón de logout para cliente */}
                    {cliente && onLogout && (
                        <button
                            onClick={onLogout}
                            className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors group relative"
                            title="Cerrar sesión"
                        >
                            <div className="icon-log-out text-gray-500 group-hover:text-red-600"></div>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}