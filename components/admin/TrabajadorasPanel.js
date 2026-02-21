// components/admin/TrabajadorasPanel.js

function TrabajadorasPanel() {
    const [trabajadoras, setTrabajadoras] = React.useState([]);
    const [mostrarForm, setMostrarForm] = React.useState(false);
    const [editando, setEditando] = React.useState(null);

    React.useEffect(() => {
        setTrabajadoras(window.salonTrabajadoras?.getAll(false) || []);
    }, []);

    const handleGuardar = (trabajadora) => {
        if (editando) {
            window.salonTrabajadoras.actualizar(editando.id, trabajadora);
        } else {
            window.salonTrabajadoras.crear(trabajadora);
        }
        setTrabajadoras(window.salonTrabajadoras.getAll(false));
        setMostrarForm(false);
        setEditando(null);
    };

    const handleEliminar = (id) => {
        if (confirm('¿Eliminar esta trabajadora?')) {
            window.salonTrabajadoras.eliminar(id);
            setTrabajadoras(window.salonTrabajadoras.getAll(false));
        }
    };

    const toggleActivo = (id) => {
        const trabajadora = trabajadoras.find(t => t.id === id);
        window.salonTrabajadoras.actualizar(id, { activo: !trabajadora.activo });
        setTrabajadoras(window.salonTrabajadoras.getAll(false));
    };

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
                {trabajadoras.map(t => (
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
                ))}
            </div>
        </div>
    );
}

function TrabajadoraForm({ trabajadora, onGuardar, onCancelar }) {
    const [form, setForm] = React.useState(trabajadora || {
        nombre: '',
        especialidad: '',
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