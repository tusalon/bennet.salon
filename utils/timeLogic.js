// utils/timeLogic.js - Versión con formato 12h (AM/PM)

// Helper to convert "HH:mm" to minutes since midnight
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Helper to convert minutes since midnight to "HH:mm" (formato 24h para BD)
function minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Convertir hora 24h a formato 12h con AM/PM
function formatTo12Hour(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    let hour12 = hours % 12;
    hour12 = hour12 === 0 ? 12 : hour12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Obtener fecha actual en formato local YYYY-MM-DD (CORREGIDO - sin problemas de zona horaria)
function getCurrentLocalDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Verificar si una hora ya pasó (para el día actual)
function isTimePassedToday(timeStr24) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const [slotHour, slotMinute] = timeStr24.split(':').map(Number);
    
    if (slotHour < currentHour) return true;
    if (slotHour === currentHour && slotMinute < currentMinute) return true;
    return false;
}

// Generar slots respetando bloques de horario (9-12 y 13-18)
function generateBaseSlots(durationMinutes) {
    const slots = [];
    
    // Bloque mañana: 9:00 a 12:00
    const morningStart = timeToMinutes("09:00");
    const morningEnd = timeToMinutes("12:00");
    
    // Bloque tarde: 13:00 a 18:00
    const afternoonStart = timeToMinutes("13:00");
    const afternoonEnd = timeToMinutes("18:00");
    
    // Generar slots en la mañana
    for (let current = morningStart; current + durationMinutes <= morningEnd; current += durationMinutes) {
        slots.push(minutesToTime(current));
    }
    
    // Generar slots en la tarde
    for (let current = afternoonStart; current + durationMinutes <= afternoonEnd; current += durationMinutes) {
        slots.push(minutesToTime(current));
    }
    
    return slots;
}

// Filtrar slots disponibles considerando reservas existentes
function filterAvailableSlots(baseSlots, durationMinutes, existingBookings) {
    return baseSlots.filter(slotStartStr => {
        const slotStart = timeToMinutes(slotStartStr);
        const slotEnd = slotStart + durationMinutes;

        // Verificar contra cada reserva existente
        const hasConflict = existingBookings.some(booking => {
            const bookingStart = timeToMinutes(booking.hora_inicio);
            const bookingEnd = timeToMinutes(booking.hora_fin);

            // Verificar superposición
            return (slotStart < bookingEnd) && (slotEnd > bookingStart);
        });

        return !hasConflict;
    });
}

// Calcular hora de fin basada en hora de inicio y duración
function calculateEndTime(startTimeStr, durationMinutes) {
    const startMins = timeToMinutes(startTimeStr);
    return minutesToTime(startMins + durationMinutes);
}