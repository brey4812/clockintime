import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {

    // 1. VERIFICAR SESIÓN
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = '../login/login.html';
        return;
    }

    // 2. OBTENER PERFIL ADMIN Y SU EMPRESA
    // Usamos los nombres de columna de tus capturas: nombre, empresa_id
    const { data: adminProfile, error: adminErr } = await supabase
        .from('profiles')
        .select('nombre, empresa_id')
        .eq('id', session.user.id)
        .single();

    if (adminErr || !adminProfile) {
        console.error("Error al obtener perfil:", adminErr);
        return;
    }

    document.getElementById('user-name-header').textContent = adminProfile.nombre;
    const empresaId = adminProfile.empresa_id;

    // 3. CARGAR ESTADÍSTICAS REALES
    async function cargarEstadisticas() {
        // Usuarios totales de la misma empresa
        const { count: totalUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('empresa_id', empresaId);

        // Solicitudes pendientes de la empresa
        const { count: totalPendientes } = await supabase
            .from('solicitudes') 
            .select('*', { count: 'exact', head: true })
            .eq('empresa_id', empresaId)
            .eq('estado', 'Pendiente');

        // Fichados hoy (quien tenga jornada iniciada hoy)
        const hoy = new Date().toISOString().split('T')[0];
        const { count: totalFichados } = await supabase
            .from('jornadas') 
            .select('*', { count: 'exact', head: true })
            .eq('empresa_id', empresaId)
            .eq('fecha', hoy);

        document.getElementById('summary-usuarios-totales').textContent = totalUsers || 0;
        document.getElementById('summary-solicitudes-pendientes').textContent = totalPendientes || 0;
        document.getElementById('summary-fichados-hoy').textContent = totalFichados || 0;
    }

    // 4. CARGAR TABLA DE SOLICITUDES RECIENTES
    async function cargarSolicitudesRecientes() {
        const listaBody = document.getElementById('lista-solicitudes-pendientes');
        
        // Relacionamos con la tabla profiles para obtener el nombre del empleado
        const { data: solicitudes, error } = await supabase
            .from('solicitudes')
            .select(`
                tipo,
                fecha_inicio,
                fecha_fin,
                estado,
                profiles (nombre, apellido)
            `)
            .eq('empresa_id', empresaId)
            .eq('estado', 'Pendiente')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error || !solicitudes || solicitudes.length === 0) {
            listaBody.innerHTML = '<tr><td colspan="4" class="text-center">No hay solicitudes pendientes.</td></tr>';
            return;
        }

        listaBody.innerHTML = solicitudes.map(sol => `
            <tr>
                <td>${sol.profiles?.nombre} ${sol.profiles?.apellido || ''}</td>
                <td>${sol.tipo}</td>
                <td>${sol.fecha_inicio} / ${sol.fecha_fin}</td>
                <td><span class="status-badge status-pending">Pendiente</span></td>
            </tr>
        `).join('');
    }

    // 5. EVENTO CERRAR SESIÓN
    document.getElementById('btn-logout-admin')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '../login/login.html';
    });

    // Carga inicial
    cargarEstadisticas();
    cargarSolicitudesRecientes();
});
