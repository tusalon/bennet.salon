// utils/auth-trabajadores.js - Autenticación de trabajadoras

const SUPABASE_URL = 'https://torwzztbyeryptydytwr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvcnd6enRieWVyeXB0eWR5dHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzODAxNzIsImV4cCI6MjA4Njk1NjE3Mn0.yISCKznhbQt5UAW5lwSuG2A2NUS71GSbirhpa9mMpyI';

console.log('👤 auth-trabajadores.js cargado');

// ============================================
// FUNCIONES DE AUTENTICACIÓN PARA TRABAJADORAS
// ============================================

// Login de trabajadora por teléfono y contraseña
window.loginTrabajadora = async function(telefono, password) {
    try {
        console.log('🔐 Intentando login de trabajadora:', telefono);
        
        // Buscar trabajadora por teléfono y contraseña
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/trabajadoras?telefono=eq.${telefono}&password=eq.${password}&activo=eq.true&select=*`,
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
        console.log('📋 Resultado login:', data);
        
        if (data && data.length > 0) {
            const trabajadora = data[0];
            // Guardar sesión
            localStorage.setItem('trabajadoraAuth', JSON.stringify({
                id: trabajadora.id,
                nombre: trabajadora.nombre,
                telefono: trabajadora.telefono
            }));
            return trabajadora;
        }
        return null;
    } catch (error) {
        console.error('Error en loginTrabajadora:', error);
        return null;
    }
};

// Verificar si un número pertenece a una trabajadora (sin contraseña)
window.verificarTrabajadoraPorTelefono = async function(telefono) {
    try {
        console.log('🔍 Verificando si es trabajadora:', telefono);
        
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/trabajadoras?telefono=eq.${telefono}&activo=eq.true&select=*`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) return null;
        
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('Error verificando trabajadora:', error);
        return null;
    }
};

// Obtener trabajadora autenticada
window.getTrabajadoraAutenticada = function() {
    const auth = localStorage.getItem('trabajadoraAuth');
    if (auth) {
        return JSON.parse(auth);
    }
    return null;
};

// Cerrar sesión de trabajadora
window.logoutTrabajadora = function() {
    localStorage.removeItem('trabajadoraAuth');
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminLoginTime');
    window.location.href = 'admin-login.html';
};

// Obtener reservas de una trabajadora específica
window.getReservasPorTrabajadora = async function(trabajadoraId, soloPendientes = true) {
    try {
        let url = `${SUPABASE_URL}/rest/v1/benettsalon?trabajador_id=eq.${trabajadoraId}&order=fecha.asc,hora_inicio.asc`;
        
        if (soloPendientes) {
            url += `&estado=neq.Cancelado`;
        }
        
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) return [];
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error obteniendo reservas:', error);
        return [];
    }
};