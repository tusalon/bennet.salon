// components/Header.js - Bennet Salon (con acceso a admin)

function Header() {
    const goToAdmin = () => {
        const isAuth = localStorage.getItem('adminAuth') === 'true';
        if (isAuth) {
            // Si ya está autenticado, va directo al panel
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
                    <div className="text-sm font-medium text-gray-500 hidden sm:block">
                        “Por una mejor versión de ti”
                    </div>
                    
                    {/* 🔥 Botón de acceso al panel de admin */}
                    <button
                        onClick={goToAdmin}
                        className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-pink-100 transition-colors group relative"
                        title="Panel de Administración"
                    >
                        <div className="icon-shield-check text-gray-500 group-hover:text-pink-600"></div>
                        
                        {/* Indicador de sesión activa (opcional) */}
                        {localStorage.getItem('adminAuth') === 'true' && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}