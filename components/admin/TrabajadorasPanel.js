// components/admin/TrabajadorasPanel.js - CON TELÉFONO Y CONTRASEÑA

function TrabajadorasPanel() {
    const [trabajadoras, setTrabajadoras] = React.useState([]);
    const [mostrarForm, setMostrarForm] = React.useState(false);
    const [editando, setEditando] = React.useState(null);
    const [cargando, setCargando] = React.useState(true);

    React.useEffect(() => {
        cargarTrabajadoras();
    }, []);

    const cargarTrabajadoras = async () => {
        setCargando(true);
        try {
            console.log('📋 Cargando trabajadoras...');
            if (window.salonTrabajadoras) {
                const lista = await window.salonTrabajadoras.getAll(false);
                console.log('✅ Trabajadoras obtenidas:', lista);
                setTrabajadoras(lista || []);
            }
        } catch (error) {
            console.error('Error cargando trabajadoras:', error);
        } finally {
            setCargando(false);
        }
    };

    const handleGuardar = async (trabajadora) => {
        try {
            console.log('💾 Guardando trabajadora:', trabajadora);
            if (editando) {
                await window.salonTrabajadoras.actualizar(editando.id, trabajadora);
            } else {
                await window.salonTrabajadoras.crear(trabajadora);
            }
            await cargarTrabajadoras();
            setMostrarForm(false);
            setEditando(null);
        } catch (error) {
            console.error('Error guardando trabajadora:', error);
            alert('Error al guardar la trabajadora');
        }
    };

    const handleEliminar = async (id) => {
        if (!confirm('¿Eliminar esta trabajadora?')) return;
        try {
            console.log('🗑️ Eliminando trabajadora:', id);
            await window.salonTrabajadoras.eliminar(id);
            await cargarTrabajadoras();
        } catch (error) {
            console.error('Error eliminando trabajadora:', error);
            alert('Error al eliminar la trabajadora');
        }
    };

    const toggleActivo = async (id) => {
        const trabajadora = trabajadoras.find(t => t.id === id);
        try {
            await window.salonTrabajadoras.actualizar(id, { activo: !trabajadora.activo });
            await cargarTrabajadoras();
        } catch (error) {
            console.error('Error cambiando estado:', error);
        }
    };

    if (cargando) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Cargando trabajadoras...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">👥 Trabajadoras</h2>
                <button
                    onClick={() => {
                        setEditando(null);
                        setMostrarForm(true);
                    }}
                    className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
                >
                    + Nueva Trabajadora
                </button>
            </div>

            {mostrarForm && (
                <TrabajadoraForm
                    trabajadora={editando}
                    onGuardar={handleGuardar}
                    onCancelar={() => {
                        setMostrarForm(false);
                        setEditando(null);
                    }}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trabajadoras.length === 0 ? (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                        No hay trabajadoras cargadas
                    </div>
                ) : (
                    trabajadoras.map(t => (
                        <div key={t.id} className={`border rounded-lg p-4 ${t.activo ? '' : 'opacity-50 bg-gray-50'}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 ${t.color} rounded-full flex items-center justify-center text-2xl`}>
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">{t.nombre}</h3>
                                            <button
                                                onClick={() => toggleActivo(t.id)}
                                                className={`text-xs px-2 py-1 rounded-full ${
                                                    t.activo 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-gray-200 text-gray-600'
                                                }`}
                                            >
                                                {t.activo ? 'Activa' : 'Inactiva'}
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-600">{t.especialidad}</p>
                                        
                                        {/* 🔥 NUEVO: Mostrar teléfono si existe */}
                                        {t.telefono && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                📱 {t.telefono}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditando(t);
                                            setMostrarForm(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleEliminar(t.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function TrabajadoraForm({ trabajadora, onGuardar, onCancelar }) {
    const [form, setForm] = React.useState(trabajadora || {
        nombre: '',
        especialidad: '',
        telefono: '',        // 🔥 NUEVO
        password: '',        // 🔥 NUEVO
        color: 'bg-pink-500',
        avatar: '👩‍🎨'
    });

    const avatares = ['👩‍🎨', '💅', '✨', '🌸', '💖', '👑'];
    const colores = [
        { value: 'bg-pink-500', label: 'Rosa' },
        { value: 'bg-purple-500', label: 'Púrpura' },
        { value: 'bg-indigo-500', label: 'Índigo' },
        { value: 'bg-blue-500', label: 'Azul' },
        { value: 'bg-green-500', label: 'Verde' },
        { value: 'bg-orange-500', label: 'Naranja' }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        onGuardar(form);
    };

    return (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-4">
                {trabajadora ? '✏️ Editar Trabajadora' : '➕ Nueva Trabajadora'}
            </h3>
            
            <div className="space-y-3">
                <input
                    type="text"
                    placeholder="Nombre"
                    value={form.nombre}
                    onChange={(e) => setForm({...form, nombre: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                />
                
                <input
                    type="text"
                    placeholder="Especialidad"
                    value={form.especialidad}
                    onChange={(e) => setForm({...form, especialidad: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                />
                
                {/* 🔥 NUEVO: Campo teléfono */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono <span className="text-xs text-gray-400">(para acceder al panel)</span>
                    </label>
                    <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            +53
                        </span>
                        <input
                            type="tel"
                            value={form.telefono}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                setForm({...form, telefono: value});
                            }}
                            className="w-full px-4 py-2 rounded-r-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition"
                            placeholder="Ej: 51111111"
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">8 dígitos después del +53</p>
                </div>
                
                {/* 🔥 NUEVO: Campo contraseña */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contraseña <span className="text-xs text-gray-400">(para acceder al panel)</span>
                    </label>
                    <input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({...form, password: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="********"
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-sm mb-1">Avatar</label>
                        <select
                            value={form.avatar}
                            onChange={(e) => setForm({...form, avatar: e.target.value})}
                            className="w-full border rounded-lg px-3 py-2"
                        >
                            {avatares.map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm mb-1">Color</label>
                        <select
                            value={form.color}
                            onChange={(e) => setForm({...form, color: e.target.value})}
                            className="w-full border rounded-lg px-3 py-2"
                        >
                            {colores.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
                <button
                    type="button"
                    onClick={onCancelar}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                >
                    Guardar
                </button>
            </div>
        </form>
    );
}