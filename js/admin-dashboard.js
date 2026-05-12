import { supabase } from './supabase-client.js';
import { initTheme } from './theme-handler.js';

document.addEventListener('DOMContentLoaded', async () => {
    initTheme();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = '../login/login.html'; return; }

    // 1. Obtener perfil del admin para filtrar por empresa_id
    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('empresa_id, nombre')
        .eq('id', session.user.id)
        .single();

    if (adminProfile && document.getElementById('user-name-header')) {
        document.getElementById('user-name-header').textContent = adminProfile.nombre;
    }

    // 2. Cargar Estadísticas Reales
    async function cargarEstadisticas() {
        const empresaId = adminProfile.empresa_id;

        // Total Usuarios
        const { count: totalUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('empresa_id', empresaId);

        // Solicitudes Pendientes
        const { count: totalPendientes } = await supabase
            .from('solicitudes') // Asumiendo que tu tabla se llama 'solicitudes'
            .select('*', { count: 'exact', head: true })
            .eq('empresa_id', empresaId)
            .eq('estado', 'pendiente');

        // Fichajes de hoy (asumiendo tabla 'fichajes')
        const hoy = new Date().toISOString().split('T')[0];
        const { count: totalFichados } = await supabase
            .from('fichajes')
            .select('*', { count: 'exact', head: true })
            .eq('empresa_id', empresaId)
            .gte('fecha', hoy);

        document.getElementById('summary-usuarios-totales').textContent = totalUsers || 0;
        document.getElementById('summary-solicitudes-pendientes').textContent = totalPendientes || 0;
        document.getElementById('summary-fichados-hoy').textContent = totalFichados || 0;
    }

    cargarEstadisticas();
});
