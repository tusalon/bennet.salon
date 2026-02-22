// utils/config.js - Configuración del salón CON SUPABASE

const SUPABASE_URL = 'https://torwzztbyeryptydytwr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvcnd6enRieWVyeXB0eWR5dHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzODAxNzIsImV4cCI6MjA4Njk1NjE3Mn0.yISCKznhbQt5UAW5lwSuG2A2NUS71GSbirhpa9mMpyI';

console.log('⚙️ config.js cargado (modo Supabase)');

let configuracionGlobal = {
    duracionTurnos: 60,
    intervaloEntreTurnos: 0,
    modo24h: false
};

let horariosTrabajadoras = {};

let ultimaActualizacion = 0;
const CACHE_DURATION = 5 * 60 * 1000;

// ============================================
// FUNCIONES CON SUPABASE
// ============================================

async function cargarConfiguracionGlobal() {
    try {
        console.log('🌐 Cargando configuración global desde Supabase...');
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/configuracion?select=*`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            if (response.status === 404) {
                // La tabla no existe, crear datos por defecto
                return null;
            }
            return null;
        }
        
        const data = await response.json();
        if (data && data.length > 0) {
            configuracionGlobal = data[0];
        }
        return configuracionGlobal;
    } catch (error) {
        console.error('Error cargando configuración:', error);
        return null;
    }
}

async function cargarHorariosTrabajadoras() {
    try {
        console.log('🌐 Cargando horarios de trabajadoras desde Supabase...');
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/horarios_trabajadoras?select=*`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            if (response.status === 404) {
                // La tabla no existe
                return {};
            }
            return {};
        }
        
        const data = await response.json();
        
        // Convertir array a objeto por trabajadora
        const horarios = {};
        data.forEach(item => {
            if (!horarios[item.trabajadora_id]) {
                horarios[item.trabajadora_id] = {
                    horas: item.horas || [],
                    dias: item.dias || []
                };
            }
        });
        
        horariosTrabajadoras = horarios;
        return horarios;
    } catch (error) {
        console.error('Error cargando horarios:', error);
        return {};
    }
}

// Funciones globales
window.salonConfig = {
    // Obtener configuración global
    get: async function() {
        if (Date.now() - ultimaActualizacion < CACHE_DURATION) {
            return { ...configuracionGlobal };
        }
        
        await cargarConfiguracionGlobal();
        ultimaActualizacion = Date.now();
        return { ...configuracionGlobal };
    },
    
    // Guardar configuración global
    guardar: async function(nuevaConfig) {
        try {
            console.log('💾 Guardando configuración global:', nuevaConfig);
            
            // Verificar si existe algún registro
            const checkResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/configuracion?select=id`,
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const existe = await checkResponse.json();
            
            let response;
            if (existe && existe.length > 0) {
                // Actualizar
                response = await fetch(
                    `${SUPABASE_URL}/rest/v1/configuracion?id=eq.${existe[0].id}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify(nuevaConfig)
                    }
                );
            } else {
                // Insertar
                response = await fetch(
                    `${SUPABASE_URL}/rest/v1/configuracion`,
                    {
                        method: 'POST',
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify(nuevaConfig)
                    }
                );
            }
            
            if (!response.ok) {
                const error = await response.text();
                console.error('Error guardando configuración:', error);
                return null;
            }
            
            const data = await response.json();
            configuracionGlobal = Array.isArray(data) ? data[0] : data;
            ultimaActualizacion = Date.now();
            
            return configuracionGlobal;
        } catch (error) {
            console.error('Error en guardar:', error);
            return null;
        }
    },
    
    // Obtener horarios de una trabajadora
    getHorariosTrabajadora: async function(trabajadoraId) {
        try {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/horarios_trabajadoras?trabajadora_id=eq.${trabajadoraId}&select=*`,
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (!response.ok) return { horas: [], dias: [] };
            
            const data = await response.json();
            if (data && data.length > 0) {
                return {
                    horas: data[0].horas || [],
                    dias: data[0].dias || []
                };
            }
            return { horas: [], dias: [] };
        } catch (error) {
            console.error('Error obteniendo horarios:', error);
            return { horas: [], dias: [] };
        }
    },
    
    // Guardar horarios de una trabajadora
    guardarHorariosTrabajadora: async function(trabajadoraId, horarios) {
        try {
            console.log(`💾 Guardando horarios para trabajadora ${trabajadoraId}:`, horarios);
            
            // Verificar si ya existe
            const checkResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/horarios_trabajadoras?trabajadora_id=eq.${trabajadoraId}&select=id`,
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const existe = await checkResponse.json();
            
            let response;
            if (existe && existe.length > 0) {
                // Actualizar
                response = await fetch(
                    `${SUPABASE_URL}/rest/v1/horarios_trabajadoras?id=eq.${existe[0].id}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({
                            horas: horarios.horas || [],
                            dias: horarios.dias || []
                        })
                    }
                );
            } else {
                // Insertar
                response = await fetch(
                    `${SUPABASE_URL}/rest/v1/horarios_trabajadoras`,
                    {
                        method: 'POST',
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({
                            trabajadora_id: trabajadoraId,
                            horas: horarios.horas || [],
                            dias: horarios.dias || []
                        })
                    }
                );
            }
            
            if (!response.ok) {
                const error = await response.text();
                console.error('Error guardando horarios:', error);
                return null;
            }
            
            const data = await response.json();
            
            // Actualizar caché
            horariosTrabajadoras[trabajadoraId] = {
                horas: horarios.horas || [],
                dias: horarios.dias || []
            };
            
            if (window.dispatchEvent) {
                window.dispatchEvent(new Event('horariosActualizados'));
            }
            
            return Array.isArray(data) ? data[0] : data;
        } catch (error) {
            console.error('Error en guardarHorariosTrabajadora:', error);
            return null;
        }
    }
};

// Cargar datos al inicio
setTimeout(async () => {
    await window.salonConfig.get();
    await cargarHorariosTrabajadoras();
}, 1000);