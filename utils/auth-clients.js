// utils/auth-clients.js - VERSIÓN COMPLETA CON SUPABASE Y SIEMPRE ARRAYS

const SUPABASE_URL = 'https://torwzztbyeryptydytwr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvcnd6enRieWVyeXB0eWR5dHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzODAxNzIsImV4cCI6MjA4Njk1NjE3Mn0.yISCKznhbQt5UAW5lwSuG2A2NUS71GSbirhpa9mMpyI';

console.log('🚀 auth-clients.js CARGADO (versión Supabase)');

// ============================================
// FUNCIONES CON SUPABASE
// ============================================

// Verificar si un cliente está autorizado
window.verificarAccesoCliente = async function(whatsapp) {
    try {
        console.log('🔍 Verificando acceso para:', whatsapp);
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/clientes_autorizados?whatsapp=eq.${whatsapp}&select=*`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            console.error('Error response:', await response.text());
            return null;
        }
        
        const data = await response.json();
        console.log('📋 Resultado verificación:', data);
        return data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('Error verificando acceso:', error);
        return null;
    }
};

// Verificar si un número está autorizado (true/false)
window.isClienteAutorizado = async function(whatsapp) {
    const cliente = await window.verificarAccesoCliente(whatsapp);
    return !!cliente;
};

// Verificar si ya tiene solicitud pendiente
window.isClientePendiente = async function(whatsapp) {
    try {
        console.log('🔍 Verificando pendiente para:', whatsapp);
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/cliente_solicitudes?whatsapp=eq.${whatsapp}&estado=eq.pendiente&select=*`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) return false;
        
        const data = await response.json();
        console.log('📋 Resultado pendiente:', data);
        return data.length > 0;
    } catch (error) {
        console.error('Error verificando pendiente:', error);
        return false;
    }
};

// Agregar solicitud pendiente
window.agregarClientePendiente = async function(nombre, whatsapp) {
    console.log('➕ Agregando cliente pendiente:', { nombre, whatsapp });
    
    try {
        // Verificar si ya está autorizado
        const autorizado = await window.verificarAccesoCliente(whatsapp);
        if (autorizado) {
            console.log('❌ Cliente ya está autorizado');
            return false;
        }
        
        // Verificar si ya tiene solicitud pendiente
        const pendiente = await window.isClientePendiente(whatsapp);
        if (pendiente) {
            console.log('❌ Cliente ya tiene solicitud pendiente');
            return false;
        }
        
        // Crear nueva solicitud
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/cliente_solicitudes`,
            {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    nombre: nombre,
                    whatsapp: whatsapp,
                    estado: 'pendiente',
                    dispositivo_info: navigator.userAgent
                })
            }
        );
        
        if (!response.ok) {
            const error = await response.text();
            console.error('Error al crear solicitud:', error);
            return false;
        }
        
        const newSolicitud = await response.json();
        console.log('✅ Solicitud creada:', newSolicitud);
        
        // Notificar al admin
        const adminPhone = "5354066204";
        const text = `🆕 NUEVA SOLICITUD\n\n👤 ${nombre}\n📱 +${whatsapp}`;
        window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(text)}`, '_blank');
        
        return true;
    } catch (error) {
        console.error('Error en agregarClientePendiente:', error);
        return false;
    }
};

// Obtener todas las solicitudes pendientes (para admin)
window.getClientesPendientes = async function() {
    try {
        console.log('📋 Obteniendo solicitudes pendientes...');
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/cliente_solicitudes?estado=eq.pendiente&order=fecha_solicitud.desc`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            console.error('Error response:', await response.text());
            return []; // ✅ SIEMPRE DEVOLVER ARRAY
        }
        
        const data = await response.json();
        console.log('✅ Pendientes obtenidos:', data);
        return Array.isArray(data) ? data : []; // ✅ ASEGURAR ARRAY
    } catch (error) {
        console.error('Error obteniendo pendientes:', error);
        return []; // ✅ SIEMPRE DEVOLVER ARRAY
    }
};

// Obtener todos los clientes autorizados (para admin)
window.getClientesAutorizados = async function() {
    try {
        console.log('📋 Obteniendo clientes autorizados...');
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/clientes_autorizados?order=fecha_aprobacion.desc`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            console.error('Error response:', await response.text());
            return []; // ✅ SIEMPRE DEVOLVER ARRAY
        }
        
        const data = await response.json();
        console.log('✅ Autorizados obtenidos:', data);
        return Array.isArray(data) ? data : []; // ✅ ASEGURAR ARRAY
    } catch (error) {
        console.error('Error obteniendo autorizados:', error);
        return []; // ✅ SIEMPRE DEVOLVER ARRAY
    }
};

// Aprobar cliente (mover de pendientes a autorizados)
window.aprobarCliente = async function(whatsapp) {
    console.log('✅ Aprobando cliente:', whatsapp);
    
    try {
        // Obtener la solicitud pendiente
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/cliente_solicitudes?whatsapp=eq.${whatsapp}&estado=eq.pendiente&select=*`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) return null;
        
        const solicitudes = await response.json();
        if (solicitudes.length === 0) return null;
        
        const solicitud = solicitudes[0];
        
        // Actualizar estado de la solicitud
        await fetch(
            `${SUPABASE_URL}/rest/v1/cliente_solicitudes?id=eq.${solicitud.id}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: 'aprobado' })
            }
        );
        
        // Insertar en clientes autorizados
        const insertResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/clientes_autorizados`,
            {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    nombre: solicitud.nombre,
                    whatsapp: solicitud.whatsapp
                })
            }
        );
        
        if (!insertResponse.ok) return null;
        
        const nuevoAutorizado = await insertResponse.json();
        console.log('✅ Cliente aprobado:', nuevoAutorizado);
        return nuevoAutorizado[0];
    } catch (error) {
        console.error('Error aprobando cliente:', error);
        return null;
    }
};

// Rechazar cliente
window.rechazarCliente = async function(whatsapp) {
    console.log('❌ Rechazando cliente:', whatsapp);
    
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/cliente_solicitudes?whatsapp=eq.${whatsapp}&estado=eq.pendiente`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: 'rechazado' })
            }
        );
        
        return response.ok;
    } catch (error) {
        console.error('Error rechazando cliente:', error);
        return false;
    }
};

// Eliminar cliente autorizado
window.eliminarClienteAutorizado = async function(whatsapp) {
    console.log('🗑️ Eliminando cliente autorizado:', whatsapp);
    
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/clientes_autorizados?whatsapp=eq.${whatsapp}`,
            {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        return response.ok;
    } catch (error) {
        console.error('Error eliminando autorizado:', error);
        return false;
    }
};

console.log('✅ auth-clientes inicializado (modo Supabase)');