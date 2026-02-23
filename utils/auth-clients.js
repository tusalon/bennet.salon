// utils/auth-clients.js - VERSIÓN COMPLETA CORREGIDA (permite reenvío si está rechazado)

console.log('🚀 auth-clients.js CARGADO (versión Supabase)');

// ============================================
// FUNCIONES CON SUPABASE
// ============================================

// Verificar si un cliente está autorizado
window.verificarAccesoCliente = async function(whatsapp) {
    try {
        console.log('🔍 Verificando acceso para:', whatsapp);
        const response = await fetch(
            `${window.SUPABASE_URL}/rest/v1/clientes_autorizados?whatsapp=eq.${whatsapp}&select=*`,
            {
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
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

// FUNCIÓN: Obtener el estado de la solicitud si existe
window.obtenerEstadoSolicitud = async function(whatsapp) {
    try {
        console.log('🔍 Obteniendo estado de solicitud para:', whatsapp);
        const response = await fetch(
            `${window.SUPABASE_URL}/rest/v1/cliente_solicitudes?whatsapp=eq.${whatsapp}&select=estado,id`,
            {
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            console.error('Error en respuesta:', await response.text());
            return null;
        }
        
        const data = await response.json();
        console.log('📋 Estado obtenido:', data);
        
        if (data.length > 0) {
            return {
                existe: true,
                estado: data[0].estado,
                id: data[0].id
            };
        }
        return { existe: false };
    } catch (error) {
        console.error('Error obteniendo estado:', error);
        return null;
    }
};

// FUNCIÓN PRINCIPAL: Agregar cliente pendiente (permite reenvío si está rechazado)
window.agregarClientePendiente = async function(nombre, whatsapp) {
    console.log('➕ Agregando cliente pendiente:', { nombre, whatsapp });
    
    try {
        // PASO 1: Verificar si ya está autorizado
        const autorizado = await window.verificarAccesoCliente(whatsapp);
        if (autorizado) {
            console.log('❌ Cliente ya está autorizado');
            alert('Ya tenés acceso al sistema. Podés ingresar directamente.');
            return false;
        }
        
        // PASO 2: Obtener estado de solicitud existente
        const estadoSolicitud = await window.obtenerEstadoSolicitud(whatsapp);
        console.log('📋 Estado de solicitud:', estadoSolicitud);
        
        // PASO 3: Si existe una solicitud
        if (estadoSolicitud && estadoSolicitud.existe) {
            
            // Caso A: Está pendiente - no permitir nuevo
            if (estadoSolicitud.estado === 'pendiente') {
                console.log('❌ Cliente ya tiene solicitud pendiente');
                alert('Ya tenés una solicitud pendiente. El dueño te contactará pronto.');
                return false;
            }
            
            // Caso B: Está aprobado - no debería pasar porque ya verificamos autorizado
            if (estadoSolicitud.estado === 'aprobado') {
                console.log('❌ Cliente ya fue aprobado (inconsistencia)');
                alert('Ya tenés acceso al sistema. Contactá al dueño si tenés problemas.');
                return false;
            }
            
            // Caso C: Está rechazado - PERMITIR REENVÍO (actualizar el existente)
            if (estadoSolicitud.estado === 'rechazado') {
                console.log('🔄 Cliente estaba rechazado, actualizando a pendiente');
                
                // Actualizar la solicitud existente a pendiente
                const updateResponse = await fetch(
                    `${window.SUPABASE_URL}/rest/v1/cliente_solicitudes?id=eq.${estadoSolicitud.id}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'apikey': window.SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({
                            nombre: nombre,
                            estado: 'pendiente',
                            fecha_solicitud: new Date().toISOString(),
                            dispositivo_info: navigator.userAgent
                        })
                    }
                );
                
                if (!updateResponse.ok) {
                    const error = await updateResponse.text();
                    console.error('Error al actualizar solicitud:', error);
                    alert('Error al procesar la solicitud. Intentá de nuevo.');
                    return false;
                }
                
                const updated = await updateResponse.json();
                console.log('✅ Solicitud actualizada a pendiente:', updated);
                
                // Notificar al admin
                const adminPhone = "5354066204";
                const text = `🔄 REENVÍO DE SOLICITUD (estaba rechazada)\n\n👤 ${nombre}\n📱 +${whatsapp}`;
                window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(text)}`, '_blank');
                
                return true;
            }
        }
        
        // PASO 4: No existe solicitud previa - crear nueva
        console.log('🆕 No existe solicitud previa, creando nueva...');
        
        const response = await fetch(
            `${window.SUPABASE_URL}/rest/v1/cliente_solicitudes`,
            {
                method: 'POST',
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
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
            
            if (response.status === 409) {
                alert('Ya existe una solicitud para este número. Por favor esperá la respuesta del dueño.');
            } else {
                alert('Error al enviar la solicitud. Intentá de nuevo.');
            }
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
        alert('Error al procesar la solicitud. Intentá más tarde.');
        return false;
    }
};

// Verificar si tiene solicitud PENDIENTE específicamente
window.isClientePendiente = async function(whatsapp) {
    try {
        console.log('🔍 Verificando pendiente para:', whatsapp);
        const response = await fetch(
            `${window.SUPABASE_URL}/rest/v1/cliente_solicitudes?whatsapp=eq.${whatsapp}&estado=eq.pendiente&select=*`,
            {
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
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

// Obtener todas las solicitudes pendientes (para admin)
window.getClientesPendientes = async function() {
    try {
        console.log('📋 Obteniendo solicitudes pendientes...');
        const response = await fetch(
            `${window.SUPABASE_URL}/rest/v1/cliente_solicitudes?estado=eq.pendiente&order=fecha_solicitud.desc`,
            {
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            console.error('Error response:', await response.text());
            return [];
        }
        
        const data = await response.json();
        console.log('✅ Pendientes obtenidos:', data);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error obteniendo pendientes:', error);
        return [];
    }
};

// Obtener todos los clientes autorizados (para admin)
window.getClientesAutorizados = async function() {
    try {
        console.log('📋 Obteniendo clientes autorizados...');
        const response = await fetch(
            `${window.SUPABASE_URL}/rest/v1/clientes_autorizados?order=fecha_aprobacion.desc`,
            {
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            console.error('Error response:', await response.text());
            return [];
        }
        
        const data = await response.json();
        console.log('✅ Autorizados obtenidos:', data);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error obteniendo autorizados:', error);
        return [];
    }
};

// Aprobar cliente (mover de pendientes a autorizados)
window.aprobarCliente = async function(whatsapp) {
    console.log('✅ Aprobando cliente:', whatsapp);
    
    try {
        // Obtener la solicitud pendiente
        const response = await fetch(
            `${window.SUPABASE_URL}/rest/v1/cliente_solicitudes?whatsapp=eq.${whatsapp}&estado=eq.pendiente&select=*`,
            {
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
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
            `${window.SUPABASE_URL}/rest/v1/cliente_solicitudes?id=eq.${solicitud.id}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: 'aprobado' })
            }
        );
        
        // Insertar en clientes autorizados
        const insertResponse = await fetch(
            `${window.SUPABASE_URL}/rest/v1/clientes_autorizados`,
            {
                method: 'POST',
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
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
            `${window.SUPABASE_URL}/rest/v1/cliente_solicitudes?whatsapp=eq.${whatsapp}&estado=eq.pendiente`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
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
            `${window.SUPABASE_URL}/rest/v1/clientes_autorizados?whatsapp=eq.${whatsapp}`,
            {
                method: 'DELETE',
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
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