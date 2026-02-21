// utils/servicios.js - Gestión de servicios

console.log('💅 servicios.js cargado');

let servicios = [
    { 
        id: 1, 
        nombre: "Esmaltado + Manicura Macro con Cera",
        duracion: 75,
        precioMin: 3.5,
        precioMax: 5,
        descripcion: "Incluye esmaltado común o semipermanente",
        activo: true
    },
    { 
        id: 2, 
        nombre: "Sistema Press On + Manicura Macro con Cera",
        duracion: 120,
        precioMin: 6,
        precioMax: 7,
        descripcion: "Precio según complejidad del diseño",
        activo: true
    },
    { 
        id: 3, 
        nombre: "Builder Gel + Manicura Macro con Cera",
        duracion: 150,
        precioMin: 6.5,
        precioMax: 7.5,
        descripcion: "Para fortalecer y alargar uñas naturales",
        activo: true
    },
    { 
        id: 4, 
        nombre: "Pedicura Spa + Esmaltado",
        duracion: 120,
        precioMin: 6.5,
        precioMax: 10,
        descripcion: "Incluye exfoliación, hidratación, masaje",
        activo: true
    },
    { 
        id: 5, 
        nombre: "Gel Semipermanente + Manicura Macro con Cera",
        duracion: 90,
        precioMin: 4.5,
        precioMax: 6,
        descripcion: "Esmaltado semipermanente de larga duración",
        activo: true
    },
    { 
        id: 6, 
        nombre: "Gel Semi Transparente + Manicura Macro con Cera",
        duracion: 90,
        precioMin: 5,
        precioMax: 6.5,
        descripcion: "Acabado natural y brillante",
        activo: true
    }
];

// Cargar servicios guardados
try {
    const saved = localStorage.getItem('salon_servicios');
    if (saved) {
        servicios = JSON.parse(saved);
        console.log('✅ Servicios cargados:', servicios);
    }
} catch (e) {
    console.error('Error cargando servicios:', e);
}

function guardarServicios() {
    localStorage.setItem('salon_servicios', JSON.stringify(servicios));
}

// Funciones globales
window.salonServicios = {
    getAll: function(activos = true) {
        if (activos) {
            return servicios.filter(s => s.activo);
        }
        return [...servicios];
    },
    getById: function(id) {
        return servicios.find(s => s.id === id);
    },
    crear: function(servicio) {
        const nuevoId = Math.max(...servicios.map(s => s.id), 0) + 1;
        const nuevo = { id: nuevoId, ...servicio, activo: true };
        servicios.push(nuevo);
        guardarServicios();
        return nuevo;
    },
    actualizar: function(id, cambios) {
        const index = servicios.findIndex(s => s.id === id);
        if (index !== -1) {
            servicios[index] = { ...servicios[index], ...cambios };
            guardarServicios();
            return servicios[index];
        }
        return null;
    },
    eliminar: function(id) {
        const index = servicios.findIndex(s => s.id === id);
        if (index !== -1) {
            servicios.splice(index, 1);
            guardarServicios();
            return true;
        }
        return false;
    }
};