// utils/config.js - Configuración del salón

console.log('⚙️ config.js cargado');

// Configuración por defecto
let configuracion = {
    horarios: {
        lunes: { activo: true, manana: { desde: "09:00", hasta: "12:00" }, tarde: { desde: "13:00", hasta: "18:00" } },
        martes: { activo: true, manana: { desde: "09:00", hasta: "12:00" }, tarde: { desde: "13:00", hasta: "18:00" } },
        miercoles: { activo: true, manana: { desde: "09:00", hasta: "12:00" }, tarde: { desde: "13:00", hasta: "18:00" } },
        jueves: { activo: true, manana: { desde: "09:00", hasta: "12:00" }, tarde: { desde: "13:00", hasta: "18:00" } },
        viernes: { activo: true, manana: { desde: "09:00", hasta: "12:00" }, tarde: { desde: "13:00", hasta: "18:00" } },
        sabado: { activo: true, manana: { desde: "09:00", hasta: "12:00" }, tarde: { desde: "13:00", hasta: "18:00" } },
        domingo: { activo: false }
    },
    duracionTurnos: 60,
    intervaloEntreTurnos: 0
};

// Cargar configuración guardada
try {
    const saved = localStorage.getItem('salon_config');
    if (saved) {
        configuracion = JSON.parse(saved);
        console.log('✅ Configuración cargada:', configuracion);
    }
} catch (e) {
    console.error('Error cargando configuración:', e);
}

// Funciones globales
window.salonConfig = {
    get: function() {
        return { ...configuracion };
    },
    guardar: function(nuevaConfig) {
        configuracion = { ...configuracion, ...nuevaConfig };
        localStorage.setItem('salon_config', JSON.stringify(configuracion));
        console.log('💾 Configuración guardada:', configuracion);
        return configuracion;
    },
    getHorariosDia: function(dia) {
        return configuracion.horarios[dia] || { activo: false };
    }
};