// utils/config.js - Configuración del salón CON SUPABASE (CORREGIDO)

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
            `${window.SUPABASE_URL}/rest/v1/configuracion?select=*`,
            {
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            if (response.status === 404) {
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
            `${window.SUPABASE_URL}/rest/v1/horarios_trabajadoras?select=*`,
            {
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            if (response.status === 404) {
                return {};
            }
            return {};
        }
        
        const data = await response.json();
        
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
    get: async function() {
        if (Date.now() - ultimaActualizacion < CACHE_DURATION) {
            return { ...configuracionGlobal };
        }
        
        await cargarConfiguracionGlobal();
        ultimaActualizacion = Date.now();
        return { ...configuracionGlobal };
    },
    
    guardar: async function(nuevaConfig) {
        try {
            console.log('💾 Guardando configuración global:', nuevaConfig);
            
            const checkResponse = await fetch(
                `${window.SUPABASE_URL}/rest/v1/configuracion?select=id`,
                {
                    headers: {
                        'apikey': window.SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const existe = await checkResponse.json();
            
            let response;
            if (existe && existe.length > 0) {
                response = await fetch(
                    `${window.SUPABASE_URL}/rest/v1/configuracion?id=eq.${existe[0].id}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'apikey': window.SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify(nuevaConfig)
                    }
                );
            } else {
                response = await fetch(
                    `${window.SUPABASE_URL}/rest/v1/configuracion`,
                    {
                        method: 'POST',
                        headers: {
                            'apikey': window.SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
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
    
    getHorariosTrabajadora: async function(trabajadoraId) {
        try {
            const response = await fetch(
                `${window.SUPABASE_URL}/rest/v1/horarios_trabajadoras?trabajadora_id=eq.${trabajadoraId}&select=*`,
                {
                    headers: {
                        'apikey': window.SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
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
    
    guardarHorariosTrabajadora: async function(trabajadoraId, horarios) {
        try {
            console.log(`💾 Guardando horarios para trabajadora ${trabajadoraId}:`, horarios);
            
            const checkResponse = await fetch(
                `${window.SUPABASE_URL}/rest/v1/horarios_trabajadoras?trabajadora_id=eq.${trabajadoraId}&select=id`,
                {
                    headers: {
                        'apikey': window.SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const existe = await checkResponse.json();
            
            let response;
            if (existe && existe.length > 0) {
                response = await fetch(
                    `${window.SUPABASE_URL}/rest/v1/horarios_trabajadoras?id=eq.${existe[0].id}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'apikey': window.SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
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
                response = await fetch(
                    `${window.SUPABASE_URL}/rest/v1/horarios_trabajadoras`,
                    {
                        method: 'POST',
                        headers: {
                            'apikey': window.SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
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

console.log('✅ salonConfig inicializado');