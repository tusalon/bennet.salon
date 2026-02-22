// Dentro de handleGuardar, después de guardar:
const handleGuardar = (servicio) => {
    if (editando) {
        window.salonServicios.actualizar(editando.id, servicio);
    } else {
        window.salonServicios.crear(servicio);
    }
    // Recargar la lista
    setServicios(window.salonServicios.getAll(false));
    setMostrarForm(false);
    setEditando(null);
    
    // Forzar actualización en la app (opcional, pero útil)
    if (window.dispatchEvent) {
        window.dispatchEvent(new Event('serviciosActualizados'));
    }
};