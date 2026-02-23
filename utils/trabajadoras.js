// utils/trabajadoras.js - Gestión de trabajadoras CON SUPABASE (CORREGIDO)

console.log('👥 trabajadoras.js cargado (modo Supabase)');

let trabajadorasCache = [];
let ultimaActualizacionTrabajadoras = 0;
// 🔥 CAMBIADO: usar nombre diferente para evitar conflicto
const CACHE_DURATION_TRABAJADORAS = 5 * 60 * 1000;

async function cargarTrabajadorasDesdeDB() {
    try {
        console.log('🌐 Cargando trabajadoras desde Supabase...');
        const response = await fetch(
            `${window.SUPABASE_URL}/rest/v1/trabajadoras?select=*&order=id.asc`,
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
        console.log('✅ Trabajadoras cargadas desde Supabase:', data);
        trabajadorasCache = data;
        ultimaActualizacionTrabajadoras = Date.now();
        return data;
    } catch (error) {
        console.error('Error cargando trabajadoras:', error);
        return null;
    }
}

window.salonTrabajadoras = {
    getAll: async function(activas = true) {
        // 🔥 Usar la constante renombrada
        if (Date.now() - ultimaActualizacionTrabajadoras < CACHE_DURATION_TRABAJADORAS && trabajadorasCache.length > 0) {
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
            { id: 1, nombre: "Ana", especialidad: "Manicura y Pedicura", color: "bg-pink-500", avatar: "👩‍🎨", activo: true, nivel: 1 },
            { id: 2, nombre: "Laura", especialidad: "Uñas de Gel y Press On", color: "bg-purple-500", avatar: "💅", activo: true, nivel: 2 },
            { id: 3, nombre: "Carla", especialidad: "Diseños y Decoración", color: "bg-indigo-500", avatar: "✨", activo: true, nivel: 3 }
        ];
        trabajadorasCache = defaultData;
        ultimaActualizacionTrabajadoras = Date.now();
        return activas ? defaultData : defaultData;
    },
    
    getById: async function(id) {
        try {
            const response = await fetch(
                `${window.SUPABASE_URL}/rest/v1/trabajadoras?id=eq.${id}&select=*`,
                {
                    headers: {
                        'apikey': window.SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
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
                `${window.SUPABASE_URL}/rest/v1/trabajadoras`,
                {
                    method: 'POST',
                    headers: {
                        'apikey': window.SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        nombre: trabajadora.nombre,
                        especialidad: trabajadora.especialidad,
                        color: trabajadora.color || 'bg-pink-500',
                        avatar: trabajadora.avatar || '👩‍🎨',
                        activo: true,
                        telefono: trabajadora.telefono || null,
                        password: trabajadora.password || null,
                        nivel: trabajadora.nivel || 1
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
                `${window.SUPABASE_URL}/rest/v1/trabajadoras?id=eq.${id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': window.SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
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
                `${window.SUPABASE_URL}/rest/v1/trabajadoras?id=eq.${id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'apikey': window.SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
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

console.log('✅ salonTrabajadoras inicializado');