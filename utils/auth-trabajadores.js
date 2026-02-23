// utils/auth-trabajadores.js - Versión completa

console.log('👤 auth-trabajadores.js cargado');

// ============================================
// FUNCIONES DE AUTENTICACIÓN PARA TRABAJADORAS
// ============================================

// Login de trabajadora por teléfono y contraseña
window.loginTrabajadora = async function(telefono, password) {
    try {
        console.log('🔐 Intentando login de trabajadora:', telefono);
        
        const response = await fetch(
            `${window.SUPABASE_URL}/rest/v1/trabajadoras?telefono=eq.${telefono}&password=eq.${password}&activo=eq.true&select=*`,
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
        console.log('📋 Resultado login:', data);
        
        if (data && data.length > 0) {
            const trabajadora = data[0];
            return trabajadora;
        }
        return null;
    } catch (error) {
        console.error('Error en loginTrabajadora:', error);
        return null;
    }
};

// 🔥 FUNCIÓN IMPORTANTE: Verificar si un número pertenece a una trabajadora (SIN CONTRASEÑA)
window.verificarTrabajadoraPorTelefono = async function(telefono) {
    try {
        console.log('🔍 Verificando si es trabajadora (solo teléfono):', telefono);
        
        const response = await fetch(
            `${window.SUPABASE_URL}/rest/v1/trabajadoras?telefono=eq.${telefono}&activo=eq.true&select=id,nombre,telefono`,
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
        
        if (data && data.length > 0) {
            return data[0]; // Devolver la primera trabajadora encontrada
        }
        return null;
    } catch (error) {
        console.error('Error verificando trabajadora:', error);
        return null;
    }
};

// Obtener trabajadora autenticada desde localStorage
window.getTrabajadoraAutenticada = function() {
    const auth = localStorage.getItem('trabajadoraAuth');
    if (auth) {
        try {
            return JSON.parse(auth);
        } catch (e) {
            return null;
        }
    }
    return null;
};

// ============================================
// FUNCIONES PARA OBTENER ROL
// ============================================

// Obtener el rol de un usuario (dueño, trabajadora o cliente)
window.obtenerRolUsuario = async function(telefono) {
    try {
        console.log('🔍 Obteniendo rol para:', telefono);
        
        // Caso 1: Es el dueño? (hardcodeado)
        if (telefono === '5354066204') {
            console.log('👑 Es el dueño');
            return {
                rol: 'admin',
                nombre: 'Dueño'
            };
        }
        
        // Caso 2: Es una trabajadora?
        const trabajadoraRes = await fetch(
            `${window.SUPABASE_URL}/rest/v1/trabajadoras?telefono=eq.${telefono}&activo=eq.true&select=id,nombre`,
            {
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (trabajadoraRes.ok) {
            const trabajadoras = await trabajadoraRes.json();
            if (trabajadoras && trabajadoras.length > 0) {
                console.log('👩‍🎨 Es trabajadora:', trabajadoras[0].nombre);
                return {
                    rol: 'trabajadora',
                    id: trabajadoras[0].id,
                    nombre: trabajadoras[0].nombre
                };
            }
        }
        
        // Caso 3: Es un cliente normal
        return {
            rol: 'cliente',
            nombre: null
        };
        
    } catch (error) {
        console.error('Error obteniendo rol:', error);
        return { rol: 'cliente' };
    }
};

// Verificar si tiene acceso al panel (para el header)
window.tieneAccesoPanel = async function(telefono) {
    const rol = await window.obtenerRolUsuario(telefono);
    return rol.rol === 'admin' || rol.rol === 'trabajadora';
};

// Obtener reservas por trabajadora
window.getReservasPorTrabajadora = async function(trabajadoraId, soloActivas = true) {
    try {
        console.log(`📋 Obteniendo reservas para trabajadora ${trabajadoraId}`);
        let url = `${window.SUPABASE_URL}/rest/v1/benettsalon?trabajador_id=eq.${trabajadoraId}&order=fecha.desc,hora_inicio.asc`;
        
        if (soloActivas) {
            url += '&estado=neq.Cancelado';
        }
        
        const response = await fetch(
            url,
            {
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) return [];
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error obteniendo reservas:', error);
        return [];
    }
};