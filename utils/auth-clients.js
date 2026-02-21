// utils/auth-clients.js - VERSIÓN CON ELIMINAR AUTORIZADOS

console.log('🚀 auth-clients.js CARGADO');

// ============================================
// DATOS
// ============================================
let CLIENTES_AUTORIZADOS = ['5354066204']; // Dueño
let clientesPendientes = [];

// Cargar datos guardados
try {
    const saved = localStorage.getItem('clientes_autorizados');
    if (saved) {
        CLIENTES_AUTORIZADOS = JSON.parse(saved);
        console.log('✅ Autorizados cargados:', CLIENTES_AUTORIZADOS);
    }
} catch (e) {
    console.error('Error cargando autorizados:', e);
}

try {
    const saved = localStorage.getItem('clientes_pendientes');
    if (saved) {
        clientesPendientes = JSON.parse(saved);
        console.log('✅ Pendientes cargados:', clientesPendientes);
    }
} catch (e) {
    console.error('Error cargando pendientes:', e);
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function guardarPendientes() {
    localStorage.setItem('clientes_pendientes', JSON.stringify(clientesPendientes));
    console.log('💾 Pendientes guardados:', clientesPendientes);
}

function guardarAutorizados() {
    localStorage.setItem('clientes_autorizados', JSON.stringify(CLIENTES_AUTORIZADOS));
    console.log('💾 Autorizados guardados:', CLIENTES_AUTORIZADOS);
}

// ============================================
// FUNCIONES GLOBALES
// ============================================

// Obtener clientes pendientes
window.getClientesPendientes = function() {
    console.log('📋 getClientesPendientes() llamado');
    return [...clientesPendientes];
};

// Obtener clientes autorizados (solo números)
window.getClientesAutorizados = function() {
    console.log('📋 getClientesAutorizados() llamado');
    return [...CLIENTES_AUTORIZADOS];
};

// Verificar si un cliente está autorizado
window.isClienteAutorizado = function(whatsapp) {
    return CLIENTES_AUTORIZADOS.includes(whatsapp);
};

// Verificar si un cliente está pendiente
window.isClientePendiente = function(whatsapp) {
    return clientesPendientes.some(c => c.whatsapp === whatsapp);
};

// Agregar cliente pendiente
window.agregarClientePendiente = function(nombre, whatsapp) {
    console.log('➕ Agregando cliente pendiente:', { nombre, whatsapp });
    
    if (window.isClienteAutorizado(whatsapp) || window.isClientePendiente(whatsapp)) {
        console.log('❌ Cliente ya existe');
        return false;
    }
    
    const nuevoCliente = {
        nombre: nombre,
        whatsapp: whatsapp,
        fechaSolicitud: new Date().toISOString(),
        estado: 'pendiente'
    };
    
    clientesPendientes.push(nuevoCliente);
    guardarPendientes();
    
    // Notificar al admin
    const adminPhone = "5354066204";
    const text = `🆕 NUEVA SOLICITUD\n\n👤 ${nombre}\n📱 +${whatsapp}`;
    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(text)}`, '_blank');
    
    return true;
};

// Aprobar cliente
window.aprobarCliente = function(whatsapp) {
    console.log('✅ Aprobando cliente:', whatsapp);
    
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
};

// Rechazar cliente
window.rechazarCliente = function(whatsapp) {
    console.log('❌ Rechazando cliente:', whatsapp);
    
    const index = clientesPendientes.findIndex(c => c.whatsapp === whatsapp);
    if (index !== -1) {
        const cliente = clientesPendientes[index];
        clientesPendientes.splice(index, 1);
        guardarPendientes();
        return cliente;
    }
    return null;
};

// 🔥 NUEVO: Eliminar cliente autorizado
window.eliminarClienteAutorizado = function(whatsapp) {
    console.log('🗑️ Eliminando cliente autorizado:', whatsapp);
    
    // No permitir eliminar al dueño
    if (whatsapp === '5354066204') {
        alert('No se puede eliminar al dueño');
        return null;
    }
    
    const index = CLIENTES_AUTORIZADOS.findIndex(w => w === whatsapp);
    if (index !== -1) {
        const eliminado = CLIENTES_AUTORIZADOS[index];
        CLIENTES_AUTORIZADOS.splice(index, 1);
        guardarAutorizados();
        return { whatsapp: eliminado };
    }
    return null;
};

// Verificar acceso
window.verificarAccesoCliente = function(whatsapp) {
    return window.isClienteAutorizado(whatsapp);
};

console.log('✅ auth-clientes inicializado. Funciones disponibles:', {
    getClientesPendientes: typeof window.getClientesPendientes,
    getClientesAutorizados: typeof window.getClientesAutorizados,
    aprobarCliente: typeof window.aprobarCliente,
    rechazarCliente: typeof window.rechazarCliente,
    eliminarClienteAutorizado: typeof window.eliminarClienteAutorizado
});

// ============================================
// DATOS DE PRUEBA (podés eliminarlos después)
// ============================================
setTimeout(() => {
    if (clientesPendientes.length === 0 && CLIENTES_AUTORIZADOS.length === 1) {
        console.log('🧪 Agregando datos de prueba...');
        window.agregarClientePendiente('María González', '53555123456');
        window.agregarClientePendiente('Juan Pérez', '53555678901');
        window.agregarClientePendiente('Ana López', '53555333333');
    }
}, 1000);