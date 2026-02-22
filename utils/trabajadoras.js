// utils/trabajadoras.js - Gestión de trabajadoras CON SUPABASE

const SUPABASE_URL = 'https://torwzztbyeryptydytwr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvcnd6enRieWVyeXB0eWR5dHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzODAxNzIsImV4cCI6MjA4Njk1NjE3Mn0.yISCKznhbQt5UAW5lwSuG2A2NUS71GSbirhpa9mMpyI';

console.log('👥 trabajadoras.js cargado (modo Supabase)');

let trabajadorasCache = [];
let ultimaActualizacion = 0;
const CACHE_DURATION = 5 * 60 * 1000;

// Cargar trabajadoras desde Supabase
async function cargarTrabajadorasDesdeDB() {
    try {
        console.log('🌐 Cargando trabajadoras desde Supabase...');
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/trabajadoras?select=*&order=id.asc`,
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
        console.log('✅ Trabajadoras cargadas desde Supabase:', data);
        trabajadorasCache = data;
        ultimaActualizacion = Date.now();
        return data;
    } catch (error) {
        console.error('Error cargando trabajadoras:', error);
        return null;
    }
}

window.salonTrabajadoras = {
    getAll: async function(activas = true) {
        if (Date.now() - ultimaActualizacion < CACHE_DURATION && trabajadorasCache.length > 0) {
            if (activas) {
                return trabajadorasCache.filter(t => t.activo === true);
            }
            return [...trabajadorasCache];
        }
        
        const datos = await cargarTrabajadorasDesdeDB();
        if (datos) {
            if (activas) {
                return datos.filter(t => t.activo === true);
            }
            return datos;
        }
        
        // Fallback
        const defaultData = [
            { id: 1, nombre: "Ana", especialidad: "Manicura y Pedicura", color: "bg-pink-500", avatar: "👩‍🎨", activo: true },
            { id: 2, nombre: "Laura", especialidad: "Uñas de Gel y Press On", color: "bg-purple-500", avatar: "💅", activo: true },
            { id: 3, nombre: "Carla", especialidad: "Diseños y Decoración", color: "bg-indigo-500", avatar: "✨", activo: true }
        ];
        trabajadorasCache = defaultData;
        return activas ? defaultData : defaultData;
    },
    
    getById: async function(id) {
        try {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/trabajadoras?id=eq.${id}&select=*`,
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
            return data[0] || null;
        } catch (error) {
            console.error('Error obteniendo trabajadora:', error);
            return null;
        }
    },
    
    crear: async function(trabajadora) {
        try {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/trabajadoras`,
                {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        nombre: trabajadora.nombre,
                        especialidad: trabajadora.especialidad,
                        color: trabajadora.color || 'bg-pink-500',
                        avatar: trabajadora.avatar || '👩‍🎨',
                        activo: true
                    })
                }
            );
            
            if (!response.ok) {
                const error = await response.text();
                console.error('Error al crear trabajadora:', error);
                return null;
            }
            
            const nueva = await response.json();
            console.log('✅ Trabajadora creada:', nueva);
            
            trabajadorasCache = await cargarTrabajadorasDesdeDB() || trabajadorasCache;
            
            if (window.dispatchEvent) {
                window.dispatchEvent(new Event('trabajadorasActualizadas'));
            }
            
            return nueva[0];
        } catch (error) {
            console.error('Error en crear:', error);
            return null;
        }
    },
    
    actualizar: async function(id, cambios) {
        try {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/trabajadoras?id=eq.${id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(cambios)
                }
            );
            
            if (!response.ok) {
                const error = await response.text();
                console.error('Error al actualizar trabajadora:', error);
                return null;
            }
            
            const actualizada = await response.json();
            console.log('✅ Trabajadora actualizada:', actualizada);
            
            trabajadorasCache = await cargarTrabajadorasDesdeDB() || trabajadorasCache;
            
            if (window.dispatchEvent) {
                window.dispatchEvent(new Event('trabajadorasActualizadas'));
            }
            
            return actualizada[0];
        } catch (error) {
            console.error('Error en actualizar:', error);
            return null;
        }
    },
    
    eliminar: async function(id) {
        try {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/trabajadoras?id=eq.${id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (!response.ok) {
                const error = await response.text();
                console.error('Error al eliminar trabajadora:', error);
                return false;
            }
            
            console.log('✅ Trabajadora eliminada');
            
            trabajadorasCache = await cargarTrabajadorasDesdeDB() || trabajadorasCache;
            
            if (window.dispatchEvent) {
                window.dispatchEvent(new Event('trabajadorasActualizadas'));
            }
            
            return true;
        } catch (error) {
            console.error('Error en eliminar:', error);
            return false;
        }
    }
};

// Cargar al inicio
setTimeout(async () => {
    await window.salonTrabajadoras.getAll(false);
}, 1000);