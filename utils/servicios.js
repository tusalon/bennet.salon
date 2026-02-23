// utils/servicios.js - Gestión de servicios CON SUPABASE (CORREGIDO)

console.log('💅 servicios.js cargado (modo Supabase)');

// ❌ ELIMINAR esta línea si existe:
// let configuracionGlobal = {...};

let serviciosCache = [];
let ultimaActualizacionServicios = 0;
const CACHE_DURATION = 5 * 60 * 1000;

// ============================================
// FUNCIONES CON SUPABASE
// ============================================

async function cargarServiciosDesdeDB() {
    try {
        console.log('🌐 Cargando servicios desde Supabase...');
        const response = await fetch(
            `${window.SUPABASE_URL}/rest/v1/servicios?select=*&order=id.asc`,
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
        console.log('✅ Servicios cargados desde Supabase:', data);
        serviciosCache = data;
        ultimaActualizacionServicios = Date.now();
        return data;
    } catch (error) {
        console.error('Error cargando servicios:', error);
        return null;
    }
}

window.salonServicios = {
    getAll: async function(activos = true) {
        if (Date.now() - ultimaActualizacionServicios < CACHE_DURATION && serviciosCache.length > 0) {
            if (activos) {
                return serviciosCache.filter(s => s.activo === true);
            }
            return [...serviciosCache];
        }
        
        const datos = await cargarServiciosDesdeDB();
        if (datos) {
            if (activos) {
                return datos.filter(s => s.activo === true);
            }
            return datos;
        }
        
        // Fallback a datos por defecto
        const serviciosDefault = [
            { id: 1, nombre: "Esmaltado + Manicura Macro con Cera", duracion: 75, precioMin: 3.5, precioMax: 5, descripcion: "Incluye esmaltado común o semipermanente", activo: true, imagen: null },
            { id: 2, nombre: "Sistema Press On + Manicura Macro con Cera", duracion: 120, precioMin: 6, precioMax: 7, descripcion: "Precio según complejidad del diseño", activo: true, imagen: null },
            { id: 3, nombre: "Builder Gel + Manicura Macro con Cera", duracion: 150, precioMin: 6.5, precioMax: 7.5, descripcion: "Para fortalecer y alargar uñas naturales", activo: true, imagen: null },
            { id: 4, nombre: "Pedicura Spa + Esmaltado", duracion: 120, precioMin: 6.5, precioMax: 10, descripcion: "Incluye exfoliación, hidratación, masaje", activo: true, imagen: null },
            { id: 5, nombre: "Gel Semipermanente + Manicura Macro con Cera", duracion: 90, precioMin: 4.5, precioMax: 6, descripcion: "Esmaltado semipermanente de larga duración", activo: true, imagen: null },
            { id: 6, nombre: "Gel Semi Transparente + Manicura Macro con Cera", duracion: 90, precioMin: 5, precioMax: 6.5, descripcion: "Acabado natural y brillante", activo: true, imagen: null }
        ];
        serviciosCache = serviciosDefault;
        ultimaActualizacionServicios = Date.now();
        return activos ? serviciosDefault : serviciosDefault;
    },
    
    getById: async function(id) {
        try {
            const response = await fetch(
                `${window.SUPABASE_URL}/rest/v1/servicios?id=eq.${id}&select=*`,
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
            console.error('Error obteniendo servicio:', error);
            return null;
        }
    },
    
    crear: async function(servicio) {
        try {
            console.log('➕ Creando servicio:', servicio);
            const response = await fetch(
                `${window.SUPABASE_URL}/rest/v1/servicios`,
                {
                    method: 'POST',
                    headers: {
                        'apikey': window.SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        nombre: servicio.nombre,
                        duracion: servicio.duracion,
                        precioMin: servicio.precioMin,
                        precioMax: servicio.precioMax,
                        descripcion: servicio.descripcion || '',
                        activo: true,
                        imagen: servicio.imagen || null
                    })
                }
            );
            
            if (!response.ok) {
                const error = await response.text();
                console.error('Error al crear servicio:', error);
                return null;
            }
            
            const nuevo = await response.json();
            console.log('✅ Servicio creado:', nuevo);
            
            serviciosCache = await cargarServiciosDesdeDB() || serviciosCache;
            
            if (window.dispatchEvent) {
                window.dispatchEvent(new Event('serviciosActualizados'));
            }
            
            return nuevo[0];
        } catch (error) {
            console.error('Error en crear:', error);
            return null;
        }
    },
    
    actualizar: async function(id, cambios) {
        try {
            console.log('✏️ Actualizando servicio', id, 'con:', cambios);
            const response = await fetch(
                `${window.SUPABASE_URL}/rest/v1/servicios?id=eq.${id}`,
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
                console.error('Error al actualizar servicio:', error);
                return null;
            }
            
            const actualizado = await response.json();
            console.log('✅ Servicio actualizado:', actualizado);
            
            serviciosCache = await cargarServiciosDesdeDB() || serviciosCache;
            
            if (window.dispatchEvent) {
                window.dispatchEvent(new Event('serviciosActualizados'));
            }
            
            return actualizado[0];
        } catch (error) {
            console.error('Error en actualizar:', error);
            return null;
        }
    },
    
    eliminar: async function(id) {
        try {
            console.log('🗑️ Eliminando servicio:', id);
            const response = await fetch(
                `${window.SUPABASE_URL}/rest/v1/servicios?id=eq.${id}`,
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
                console.error('Error al eliminar servicio:', error);
                return false;
            }
            
            console.log('✅ Servicio eliminado');
            
            serviciosCache = await cargarServiciosDesdeDB() || serviciosCache;
            
            if (window.dispatchEvent) {
                window.dispatchEvent(new Event('serviciosActualizados'));
            }
            
            return true;
        } catch (error) {
            console.error('Error en eliminar:', error);
            return false;
        }
    }
};

// Cargar servicios al inicio
setTimeout(async () => {
    await window.salonServicios.getAll(false);
}, 1000);

console.log('✅ salonServicios inicializado');