// utils/supabase-config.js - Configuración central de Supabase
// ESTE ARCHIVO ES EL ÚNICO QUE DECLARA LAS CONSTANTES

const SUPABASE_URL = 'https://torwzztbyeryptydytwr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvcnd6enRieWVyeXB0eWR5dHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzODAxNzIsImV4cCI6MjA4Njk1NjE3Mn0.yISCKznhbQt5UAW5lwSuG2A2NUS71GSbirhpa9mMpyI';

// Hacerlas globales para que otros scripts las usen
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

console.log('✅ Configuración central de Supabase cargada');
console.log('🔗 URL:', SUPABASE_URL);
console.log('🔑 API Key:', SUPABASE_ANON_KEY ? '✓ Presente' : '✗ Falta');