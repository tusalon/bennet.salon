// components/admin/ServiciosPanel.js

function ServiciosPanel() {
    const [servicios, setServicios] = React.useState([]);
    const [mostrarForm, setMostrarForm] = React.useState(false);
    const [editando, setEditando] = React.useState(null);

    React.useEffect(() => {
        console.log('🔄 ServiciosPanel montado');
        cargarServicios();
    }, []);

    const cargarServicios = () => {
        console.log('📋 Cargando servicios desde window.salonServicios');
        if (window.salonServicios) {
            const lista = window.salonServicios.getAll(false);
            console.log('✅ Servicios obtenidos:', lista);
            setServicios(lista);
        } else {
            console.error('❌ window.salonServicios no está disponible');
        }
    };

    const handleGuardar = (servicio) => {
        console.log('💾 Guardando servicio:', servicio);
        if (editando) {
            window.salonServicios.actualizar(editando.id, servicio);
        } else {
            window.salonServicios.crear(servicio);
        }
        cargarServicios();
        setMostrarForm(false);
        setEditando(null);
        
        if (window.dispatchEvent) {
            window.dispatchEvent(new Event('serviciosActualizados'));
        }
    };

    const handleEliminar = (id) => {
        if (confirm('¿Eliminar este servicio?')) {
            console.log('🗑️ Eliminando servicio:', id);
            window.salonServicios.eliminar(id);
            cargarServicios();
        }
    };

    const toggleActivo = (id) => {
        const servicio = servicios.find(s => s.id === id);
        console.log('🔄 Cambiando estado de:', servicio.nombre);
        window.salonServicios.actualizar(id, { activo: !servicio.activo });
        cargarServicios();
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">💅 Servicios</h2>
                <button
                    onClick={() => {
                        setEditando(null);
                        setMostrarForm(true);
                    }}
                    className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
                >
                    + Nuevo Servicio
                </button>
            </div>

            {mostrarForm && (
                <ServicioForm
                    servicio={editando}
                    onGuardar={handleGuardar}
                    onCancelar={() => {
                        setMostrarForm(false);
                        setEditando(null);
                    }}
                />
            )}

            <div className="space-y-2">
                {servicios.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No hay servicios cargados
                    </div>
                ) : (
                    servicios.map(s => (
                        <div key={s.id} className={`border rounded-lg p-4 ${s.activo ? '' : 'opacity-50 bg-gray-50'}`}>
                            <div className="flex justify-between items-center">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-semibold">{s.nombre}</h3>
                                        <button
                                            onClick={() => toggleActivo(s.id)}
                                            className={`text-xs px-2 py-1 rounded-full ${
                                                s.activo 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-gray-200 text-gray-600'
                                            }`}
                                        >
                                            {s.activo ? 'Activo' : 'Inactivo'}
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {s.duracion} min | ${s.precioMin} - ${s.precioMax}
                                    </p>
                                    {s.descripcion && (
                                        <p className="text-xs text-gray-500 mt-1">{s.descripcion}</p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditando(s);
                                            setMostrarForm(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-800 px-2"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleEliminar(s.id)}
                                        className="text-red-600 hover:text-red-800 px-2"
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

function ServicioForm({ servicio, onGuardar, onCancelar }) {
    const [form, setForm] = React.useState(servicio || {
        nombre: '',
        duracion: 60,
        precioMin: 0,
        precioMax: 0,
        descripcion: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onGuardar(form);
    };

    return (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-4">
                {servicio ? '✏️ Editar Servicio' : '➕ Nuevo Servicio'}
            </h3>
            
            <div className="space-y-3">
                <input
                    type="text"
                    placeholder="Nombre del servicio"
                    value={form.nombre}
                    onChange={(e) => setForm({...form, nombre: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                />
                
                <div className="grid grid-cols-3 gap-2">
                    <input
                        type="number"
                        placeholder="Duración (min)"
                        value={form.duracion}
                        onChange={(e) => setForm({...form, duracion: parseInt(e.target.value)})}
                        className="border rounded-lg px-3 py-2"
                        required
                        min="15"
                        step="15"
                    />
                    <input
                        type="number"
                        placeholder="Precio mínimo $"
                        value={form.precioMin}
                        onChange={(e) => setForm({...form, precioMin: parseFloat(e.target.value)})}
                        className="border rounded-lg px-3 py-2"
                        required
                        min="0"
                        step="0.5"
                    />
                    <input
                        type="number"
                        placeholder="Precio máximo $"
                        value={form.precioMax}
                        onChange={(e) => setForm({...form, precioMax: parseFloat(e.target.value)})}
                        className="border rounded-lg px-3 py-2"
                        required
                        min="0"
                        step="0.5"
                    />
                </div>
                
                <textarea
                    placeholder="Descripción (opcional)"
                    value={form.descripcion}
                    onChange={(e) => setForm({...form, descripcion: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    rows="2"
                />
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