// utils/timeLogic.js - Versión con solo 2 turnos por día (8:00 AM y 2:00 PM)

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

// Obtener fecha actual en formato local YYYY-MM-DD
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

// 🔥 NUEVO: Generar solo 2 slots por día (8:00 AM y 2:00 PM)
function generateBaseSlots(durationMinutes) {
    // Solo dos horarios fijos independientemente de la duración
    return ["08:00", "14:00"];
}

// Filtrar slots disponibles considerando reservas existentes
function filterAvailableSlots(baseSlots, durationMinutes, existingBookings) {
    return baseSlots.filter(slotStartStr => {
        const slotStart = timeToMinutes(slotStartStr);
        // Para slots fijos, la duración se calcula según el servicio
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