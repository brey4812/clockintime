import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {

    // 1. VERIFICAR SESIÓN
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = '../login/login.html';
        return;
    }

    // 2. OBTENER PERFIL DEL ADMIN
    // Según tus tablas: usamos 'nombre' y 'empresa_id'
    const { data: adminProfile, error: adminErr } = await supabase
        .from('profiles')
        .select('nombre, empresa_id')
        .eq('id', session.user.id)
        .single();

    if (adminErr || !adminProfile) {
        console.error("Error obteniendo perfil:", adminErr);
        return;
    }

    // Poner nombre en el header
    const userNameHeader = document.getElementById('user-name-header');
    if (userNameHeader) userNameHeader.textContent = adminProfile.nombre;

    const empresaId = adminProfile.empresa_id;

    // 3. CARGAR ESTADÍSTICAS REALES
    async function cargarEstadisticas() {
        // Usuarios totales de la empresa
        const { count: totalUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('empresa_id', empresaId);

        // Solicitudes pendientes
        const { count: totalPendientes } = await supabase
            .from('solicitudes')
            .select('*', { count: 'exact', head: true })
            .eq('empresa_id', empresaId)
            .eq('estado', 'Pendiente');

        // Fichados hoy (buscamos en la tabla 'jornadas' según tu captura)
        const hoy = new Date().toISOString().split('T')[0];
        const { count: totalFichados } = await supabase
            .from('jornadas')
            .select('*', { count: 'exact', head: true })
            .eq('empresa_id', empresaId)
            .eq('fecha', hoy);

        if(document.getElementById('summary-usuarios-totales')) 
            document.getElementById('summary-usuarios-totales').textContent = totalUsers || 0;
        
        if(document.getElementById('summary-solicitudes-pendientes'))
            document.getElementById('summary-solicitudes-pendientes').textContent = totalPendientes || 0;
        
        if(document.getElementById('summary-fichados-hoy'))
            document.getElementById('summary-fichados-hoy').textContent = totalFichados || 0;
    }

    // 4. CARGAR TABLA DE SOLICITUDES RECIENTES
    async function cargarSolicitudesRecientes() {
        const listaBody = document.getElementById('lista-solicitudes-pendientes');
        if (!listaBody) return;

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

    // 5. CERRAR SESIÓN (CORREGIDO)
    const btnLogout = document.getElementById('btn-logout-admin');
    btnLogout?.addEventListener('click', async (e) => {
        e.preventDefault();
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert("Error al cerrar sesión");
        } else {
            window.location.href = '../login/login.html';
        }
    });

    // Ejecutar funciones
    cargarEstadisticas();
    cargarSolicitudesRecientes();
});
