// utils/trabajadoras.js - Gestión de trabajadoras

console.log('👥 trabajadoras.js cargado');

let trabajadoras = [
    { 
        id: 1, 
        nombre: "Ana", 
        especialidad: "Manicura y Pedicura",
        color: "bg-pink-500",
        avatar: "👩‍🎨",
        activo: true
    },
    { 
        id: 2, 
        nombre: "Laura", 
        especialidad: "Uñas de Gel y Press On",
        color: "bg-purple-500",
        avatar: "💅",
        activo: true
    },
    { 
        id: 3, 
        nombre: "Carla", 
        especialidad: "Diseños y Decoración",
        color: "bg-indigo-500",
        avatar: "✨",
        activo: true
    }
];

// Cargar trabajadoras guardadas
try {
    const saved = localStorage.getItem('salon_trabajadoras');
    if (saved) {
        trabajadoras = JSON.parse(saved);
        console.log('✅ Trabajadoras cargadas:', trabajadoras);
    }
} catch (e) {
    console.error('Error cargando trabajadoras:', e);
}

function guardarTrabajadoras() {
    localStorage.setItem('salon_trabajadoras', JSON.stringify(trabajadoras));
}

// Funciones globales
window.salonTrabajadoras = {
    getAll: function(activas = true) {
        if (activas) {
            return trabajadoras.filter(t => t.activo);
        }
        return [...trabajadoras];
    },
    getById: function(id) {
        return trabajadoras.find(t => t.id === id);
    },
    crear: function(trabajadora) {
        const nuevoId = Math.max(...trabajadoras.map(t => t.id), 0) + 1;
        const nueva = { id: nuevoId, ...trabajadora, activo: true };
        trabajadoras.push(nueva);
        guardarTrabajadoras();
        return nueva;
    },
    actualizar: function(id, cambios) {
        const index = trabajadoras.findIndex(t => t.id === id);
        if (index !== -1) {
            trabajadoras[index] = { ...trabajadoras[index], ...cambios };
            guardarTrabajadoras();
            return trabajadoras[index];
        }
        return null;
    },
    eliminar: function(id) {
        const index = trabajadoras.findIndex(t => t.id === id);
        if (index !== -1) {
            trabajadoras.splice(index, 1);
            guardarTrabajadoras();
            return true;
        }
        return false;
    }
};