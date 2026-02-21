// utils/auth-clients.js - VERSIÓN COMPLETA CON TODAS LAS FUNCIONES

console.log('🚀 auth-clients.js CARGADO');

// ============================================
// ESTRUCTURA DE DATOS
// ============================================
let autorizados = [
    { nombre: 'Dueño', whatsapp: '5354066204' }
];

let pendientes = [];

// ============================================
// CARGAR DATOS GUARDADOS
// ============================================
try {
    const saved = localStorage.getItem('autorizados_con_nombres');
    if (saved) {
        autorizados = JSON.parse(saved);
        console.log('✅ Autorizados cargados:', autorizados);
    } else {
        const viejos = localStorage.getItem('clientes_autorizados');
        if (viejos) {
            const numeros = JSON.parse(viejos);
            autorizados = numeros.map(num => ({ 
                nombre: num === '5354066204' ? 'Dueño' : `Cliente ${num.slice(-4)}`, 
                whatsapp: num 
            }));
            guardarAutorizados();
            localStorage.removeItem('clientes_autorizados');
            console.log('🔄 Migrados autorizados viejos:', autorizados);
        }
    }
} catch (e) {
    console.error('Error cargando autorizados:', e);
}

try {
    const saved = localStorage.getItem('pendientes_con_nombres');
    if (saved) {
        pendientes = JSON.parse(saved);
        console.log('✅ Pendientes cargados:', pendientes);
    } else {
        const viejos = localStorage.getItem('clientes_pendientes');
        if (viejos) {
            pendientes = JSON.parse(viejos);
            guardarPendientes();
            localStorage.removeItem('clientes_pendientes');
            console.log('🔄 Migrados pendientes viejos:', pendientes);
        }
    }
} catch (e) {
    console.error('Error cargando pendientes:', e);
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function guardarPendientes() {
    localStorage.setItem('pendientes_con_nombres', JSON.stringify(pendientes));
    console.log('💾 Pendientes guardados:', pendientes);
}

function guardarAutorizados() {
    localStorage.setItem('autorizados_con_nombres', JSON.stringify(autorizados));
    console.log('💾 Autorizados guardados:', autorizados);
}

// ============================================
// FUNCIONES GLOBALES
// ============================================

// Obtener clientes pendientes
window.getClientesPendientes = function() {
    console.log('📋 getClientesPendientes() llamado');
    return [...pendientes];
};

// Obtener clientes autorizados
window.getClientesAutorizados = function() {
    console.log('📋 getClientesAutorizados() llamado');
    return [...autorizados];
};

// Verificar si un número está autorizado (true/false)
window.isClienteAutorizado = function(whatsapp) {
    return autorizados.some(a => a.whatsapp === whatsapp);
};

// Verificar si un número está pendiente
window.isClientePendiente = function(whatsapp) {
    return pendientes.some(p => p.whatsapp === whatsapp);
};

// Verificar acceso (devuelve el objeto si existe)
window.verificarAccesoCliente = function(whatsapp) {
    return autorizados.find(a => a.whatsapp === whatsapp) || null;
};

// Agregar cliente pendiente
window.agregarClientePendiente = function(nombre, whatsapp) {
    console.log('➕ Agregando cliente pendiente:', { nombre, whatsapp });
    
    if (window.isClienteAutorizado(whatsapp)) {
        console.log('❌ Cliente ya está autorizado');
        return false;
    }
    
    if (window.isClientePendiente(whatsapp)) {
        console.log('❌ Cliente ya está pendiente');
        return false;
    }
    
    const nuevoCliente = {
        nombre: nombre,
        whatsapp: whatsapp,
        fechaSolicitud: new Date().toISOString()
    };
    
    pendientes.push(nuevoCliente);
    guardarPendientes();
    
    const adminPhone = "5354066204";
    const text = `🆕 NUEVA SOLICITUD\n\n👤 ${nombre}\n📱 +${whatsapp}`;
    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(text)}`, '_blank');
    
    return true;
};

// Aprobar cliente
window.aprobarCliente = function(whatsapp) {
    console.log('✅ Aprobando cliente:', whatsapp);
    
    const index = pendientes.findIndex(p => p.whatsapp === whatsapp);
    if (index !== -1) {
        const cliente = pendientes[index];
        autorizados.push({
            nombre: cliente.nombre,
            whatsapp: cliente.whatsapp
        });
        pendientes.splice(index, 1);
        guardarPendientes();
        guardarAutorizados();
        return cliente;
    }
    return null;
};

// Rechazar cliente
window.rechazarCliente = function(whatsapp) {
    console.log('❌ Rechazando cliente:', whatsapp);
    
    const index = pendientes.findIndex(p => p.whatsapp === whatsapp);
    if (index !== -1) {
        const cliente = pendientes[index];
        pendientes.splice(index, 1);
        guardarPendientes();
        return cliente;
    }
    return null;
};

// Eliminar cliente autorizado
window.eliminarClienteAutorizado = function(whatsapp) {
    console.log('🗑️ Eliminando cliente autorizado:', whatsapp);
    
    if (whatsapp === '5354066204') {
        alert('No se puede eliminar al dueño');
        return null;
    }
    
    const index = autorizados.findIndex(a => a.whatsapp === whatsapp);
    if (index !== -1) {
        const eliminado = autorizados[index];
        autorizados.splice(index, 1);
        guardarAutorizados();
        return eliminado;
    }
    return null;
};

console.log('✅ auth-clientes inicializado. Funciones disponibles:', {
    getClientesPendientes: typeof window.getClientesPendientes,
    getClientesAutorizados: typeof window.getClientesAutorizados,
    isClienteAutorizado: typeof window.isClienteAutorizado,
    isClientePendiente: typeof window.isClientePendiente,
    verificarAccesoCliente: typeof window.verificarAccesoCliente,
    aprobarCliente: typeof window.aprobarCliente,
    rechazarCliente: typeof window.rechazarCliente,
    eliminarClienteAutorizado: typeof window.eliminarClienteAutorizado
});