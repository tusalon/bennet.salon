// utils/api.js - Versión ultra ligera con cache (ADAPTADA PARA BENETTSALON)

const SUPABASE_URL = 'https://torwzztbyeryptydytwr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvcnd6enRieWVyeXB0eWR5dHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzODAxNzIsImV4cCI6MjA4Njk1NjE3Mn0.yISCKznhbQt5UAW5lwSuG2A2NUS71GSbirhpa9mMpyI';

const TABLE_NAME = 'benettsalon';

// Cache en memoria
const cache = {
    bookingsByDate: new Map(),
    allBookings: null,
    allBookingsTimestamp: null
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Cache en localStorage (para persistencia)
const STORAGE_CACHE_KEY = 'turnos_cache_v1';

/**
 * Fetch all bookings for a specific date
 */
async function getBookingsByDate(dateStr) {
    // 1. Verificar cache en memoria
    const cached = cache.bookingsByDate.get(dateStr);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        console.log('🗂️ Usando cache en memoria para', dateStr);
        return cached.data;
    }

    // 2. Verificar localStorage
    const stored = localStorage.getItem(`${STORAGE_CACHE_KEY}_${dateStr}`);
    if (stored) {
        const { data, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < 60 * 60 * 1000) { // 1 hora
            console.log('💾 Usando cache localStorage para', dateStr);
            cache.bookingsByDate.set(dateStr, { data, timestamp: Date.now() });
            return data;
        }
    }

    // 3. Petición a Supabase
    try {
        console.log('🌐 Solicitando turnos para', dateStr);
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?fecha=eq.${dateStr}&estado=neq.Cancelado&select=*`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Accept-Encoding': 'gzip, deflate'
                }
            }
        );
        
        if (!response.ok) throw new Error('Error fetching bookings');
        
        const data = await response.json();
        
        // Guardar en memoria
        cache.bookingsByDate.set(dateStr, { data, timestamp: Date.now() });
        
        // Guardar en localStorage
        localStorage.setItem(`${STORAGE_CACHE_KEY}_${dateStr}`, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
        
        return data;
    } catch (error) {
        console.error('Error fetching bookings:', error);
        
        // Fallback a localStorage aunque esté viejo
        if (stored) {
            console.log('⚠️ Usando localStorage por error de red');
            const { data } = JSON.parse(stored);
            return data;
        }
        
        // Fallback a cache en memoria
        if (cached) {
            console.log('⚠️ Usando cache memoria viejo por error de red');
            return cached.data;
        }
        
        return [];
    }
}

/**
 * Create a new booking - VERSIÓN MEJORADA: retorna los datos creados
 */
async function createBooking(bookingData) {
    try {
        // Mapear campos del formulario a la tabla en Supabase
        const dataForSupabase = {
            cliente_nombre: bookingData.cliente_nombre,
            cliente_whatsapp: bookingData.cliente_whatsapp,
            servicio: bookingData.servicio,
            duracion: bookingData.duracion,
            fecha: bookingData.fecha,
            hora_inicio: bookingData.hora_inicio,
            hora_fin: bookingData.hora_fin,
            estado: bookingData.estado || 'Reservado',
            email: bookingData.email || null
        };

        console.log('📤 Enviando a Supabase:', dataForSupabase);

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/${TABLE_NAME}`,
            {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation' // ✅ IMPORTANTE: Para que devuelva el objeto creado
                },
                body: JSON.stringify(dataForSupabase)
            }
        );
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
            throw new Error('Error creating booking');
        }
        
        const newBooking = await response.json();
        console.log('✅ Reserva creada exitosamente:', newBooking);
        
        // Limpiar cache de la fecha afectada
        cache.bookingsByDate.delete(bookingData.fecha);
        localStorage.removeItem(`${STORAGE_CACHE_KEY}_${bookingData.fecha}`);
        cache.allBookings = null;
        
        return { success: true, data: newBooking[0] }; // ✅ Devolvemos los datos reales de la BD
    } catch (error) {
        console.error('❌ Error creating booking:', error);
        throw error;
    }
}

/**
 * Fetch all bookings (for admin)
 */
async function getAllBookings() {
    if (cache.allBookings && (Date.now() - cache.allBookingsTimestamp) < CACHE_DURATION) {
        return cache.allBookings;
    }

    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*&order=fecha.desc,hora_inicio.asc`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Accept-Encoding': 'gzip, deflate'
                }
            }
        );
        
        if (!response.ok) throw new Error('Error fetching all bookings');
        
        const data = await response.json();
        
        cache.allBookings = data;
        cache.allBookingsTimestamp = Date.now();
        
        return data;
    } catch (error) {
        console.error('Error fetching all bookings:', error);
        return cache.allBookings || [];
    }
}

/**
 * Update booking status (invalida cache)
 */
async function updateBookingStatus(id, newStatus) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.${id}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: newStatus })
            }
        );
        
        if (!response.ok) throw new Error('Error updating booking');
        
        // Limpiar todo el cache
        cache.bookingsByDate.clear();
        cache.allBookings = null;
        
        // Limpiar localStorage
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(STORAGE_CACHE_KEY)) {
                localStorage.removeItem(key);
            }
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error updating booking:', error);
        throw error;
    }
}