// utils/auth-clients.js - Sistema de autorización de clientes

// Lista de clientes autorizados (números de WhatsApp)
// Formato: 53XXXXXXXXX (con código de país)
let CLIENTES_AUTORIZADOS = [
    '5354066204', // Dueño/tester
];

// Cargar autorizados del localStorage
try {
    const saved = localStorage.getItem('clientes_autorizados');
    if (saved) {
        CLIENTES_AUTORIZADOS = JSON.parse(saved);
    }
} catch (e) {
    console.error('Error cargando autorizados:', e);
}

// Lista de clientes pendientes de autorización
let clientesPendientes = [];

// Cargar pendientes del localStorage
try {
    const saved = localStorage.getItem('clientes_pendientes');
    if (saved) {
        clientesPendientes = JSON.parse(saved);
    }
} catch (e) {
    console.error('Error cargando pendientes:', e);
}

// Guardar pendientes en localStorage
function guardarPendientes() {
    localStorage.setItem('clientes_pendientes', JSON.stringify(clientesPendientes));
}

// Guardar autorizados en localStorage
function guardarAutorizados() {
    localStorage.setItem('clientes_autorizados', JSON.stringify(CLIENTES_AUTORIZADOS));
}

// Verificar si un número está autorizado
function isClienteAutorizado(whatsapp) {
    return CLIENTES_AUTORIZADOS.includes(whatsapp);
}

// Verificar si un número está pendiente
function isClientePendiente(whatsapp) {
    return clientesPendientes.some(c => c.whatsapp === whatsapp);
}

// Agregar cliente a lista de pendientes
function agregarClientePendiente(nombre, whatsapp) {
    // Verificar si ya existe
    if (isClienteAutorizado(whatsapp) || isClientePendiente(whatsapp)) {
        return false;
    }
    
    clientesPendientes.push({
        nombre,
        whatsapp,
        fechaSolicitud: new Date().toISOString(),
        estado: 'pendiente'
    });
    
    guardarPendientes();
    
    // Enviar notificación al admin por WhatsApp
    const adminPhone = "5354066204";
    const text = `🆕 NUEVA SOLICITUD DE ACCESO\n\n👤 Nombre: ${nombre}\n📱 WhatsApp: +${whatsapp}\n📅 Fecha: ${new Date().toLocaleDateString()}\n⏰ Hora: ${new Date().toLocaleTimeString()}\n\nAprobarlo desde el panel de admin.`;
    const encodedText = encodeURIComponent(text);
    
    setTimeout(() => {
        window.open(`https://wa.me/${adminPhone}?text=${encodedText}`, '_blank');
    }, 1000);
    
    return true;
}

// Aprobar un cliente pendiente
function aprobarCliente(whatsapp) {
    const index = clientesPendientes.findIndex(c => c.whatsapp === whatsapp);
    if (index !== -1) {
        const cliente = clientesPendientes[index];
        CLIENTES_AUTORIZADOS.push(whatsapp);
        clientesPendientes.splice(index, 1);
        guardarPendientes();
        guardarAutorizados();
        return cliente;
    }
    return null;
}

// Rechazar un cliente pendiente
function rechazarCliente(whatsapp) {
    const index = clientesPendientes.findIndex(c => c.whatsapp === whatsapp);
    if (index !== -1) {
        const cliente = clientesPendientes[index];
        clientesPendientes.splice(index, 1);
        guardarPendientes();
        return cliente;
    }
    return null;
}

// Obtener lista de pendientes
function getClientesPendientes() {
    return [...clientesPendientes];
}

// Obtener lista de autorizados
function getClientesAutorizados() {
    return [...CLIENTES_AUTORIZADOS];
}

// Verificar acceso para un número
function verificarAccesoCliente(whatsapp) {
    return isClienteAutorizado(whatsapp);
}