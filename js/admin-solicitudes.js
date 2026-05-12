import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {

    // =============================
    // ELEMENTOS DEL DOM
    // =============================
    const solicitudesTbody = document.getElementById('solicitudes-admin-tbody');
    const filtroPendientes = document.getElementById('filtro-pendientes');
    const filtroAprobadas  = document.getElementById('filtro-aprobadas');
    const filtroRechazadas = document.getElementById('filtro-rechazadas');
    const filtroTodas      = document.getElementById('filtro-todas');
    const userNameHeader   = document.getElementById('user-name-header');

    // =============================
    // ESTADO
    // =============================
    let filtroActivo = 'todas';
    let empresaId = null;

    // =============================
    // 1. VERIFICAR SESIÓN Y CARGAR ADMIN
    // =============================
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        window.location.href = '../login/login.html';
        return;
    }

    // Obtenemos el perfil del admin para saber su empresa_id
    const { data: adminProfile, error: adminError } = await supabase
        .from('profiles')
        .select('nombre, empresa_id')
        .eq('id', session.user.id)
        .single();

    if (adminError || !adminProfile) {
        console.error("Error al obtener perfil del admin:", adminError);
        return;
    }

    if (userNameHeader) userNameHeader.textContent = adminProfile.nombre;
    empresaId = adminProfile.empresa_id;

    // =============================
    // 2. RENDERIZAR TABLA
    // =============================
    async function renderTablaSolicitudes() {
        if (!solicitudesTbody || !empresaId) return;

        solicitudesTbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando solicitudes...</td></tr>';

        // Consulta uniendo con profiles para traer nombre y apellido
        let query = supabase
            .from('solicitudes')
            .select(`
                id,
                tipo,
                fecha_inicio,
                fecha_fin,
                estado,
                profiles!solicitudes_user_id_fkey (nombre, apellido)
            `)
            .eq('empresa_id', empresaId)
            .order('created_at', { ascending: false });

        // Aplicar filtro si no es "todas"
        if (filtroActivo !== 'todas') {
            query = query.eq('estado', filtroActivo);
        }

        const { data: solicitudes, error } = await query;

        if (error) {
            console.error("Error cargando solicitudes:", error);
            solicitudesTbody.innerHTML = '<tr><td colspan="6" class="text-center">Error al cargar datos.</td></tr>';
            return;
        }

        solicitudesTbody.innerHTML = '';

        if (!solicitudes || solicitudes.length === 0) {
            solicitudesTbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay solicitudes que mostrar.</td></tr>';
            return;
        }

        solicitudes.forEach(sol => {
            const nombreEmp = `${sol.profiles?.nombre || 'Desconocido'} ${sol.profiles?.apellido || ''}`;
            const estadoReal = sol.estado || 'Pendiente';
            
            // Definimos la clase del badge según el estado para el CSS
            let estadoClase = 'status-pending';
            if (estadoReal === 'Aprobada')  estadoClase = 'status-approved';
            if (estadoReal === 'Rechazada') estadoClase = 'status-rejected';

            const esPendiente = estadoReal === 'Pendiente';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${nombreEmp}</td>
                <td>${sol.tipo || '-'}</td>
                <td>${sol.fecha_inicio || '-'}</td>
                <td>${sol.fecha_fin || '-'}</td>
                <td><span class="status-badge ${estadoClase}">${estadoReal}</span></td>
                <td class="actions-cell">
                    ${esPendiente ? `
                        <button class="btn-action btn-approve" data-id="${sol.id}" title="Aprobar">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-action btn-reject" data-id="${sol.id}" title="Rechazar">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : '<span style="color:var(--text-light);font-size:0.85rem;">Procesada</span>'}
                </td>`;

            // Asignar eventos a los botones de aprobar/rechazar
            if (esPendiente) {
                row.querySelector('.btn-approve').addEventListener('click', () => 
                    procesarSolicitud(sol.id, 'Aprobada'));
                row.querySelector('.btn-reject').addEventListener('click', () => 
                    procesarSolicitud(sol.id, 'Rechazada'));
            }

            solicitudesTbody.appendChild(row);
        });
    }

    // =============================
    // 3. PROCESAR SOLICITUD (UPDATE EN BD)
    // =============================
    async function procesarSolicitud(solId, nuevoEstado) {
        const { error } = await supabase
            .from('solicitudes')
            .update({ estado: nuevoEstado })
            .eq('id', solId);

        if (error) {
            alert("Error al procesar la solicitud: " + error.message);
        } else {
            alert(`Solicitud ${nuevoEstado.toLowerCase()} correctamente.`);
            renderTablaSolicitudes(); // Recargamos la tabla
        }
    }

    // =============================
    // 4. FILTROS
    // =============================
    function activarFiltro(nuevoFiltro, btnActivo) {
        filtroActivo = nuevoFiltro;
        // Limpiar clases de botones de filtro en el HTML
        document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
        btnActivo?.classList.add('active');
        renderTablaSolicitudes();
    }

    filtroTodas?.addEventListener('click',      () => activarFiltro('todas',     filtroTodas));
    filtroPendientes?.addEventListener('click', () => activarFiltro('Pendiente', filtroPendientes));
    filtroAprobadas?.addEventListener('click',  () => activarFiltro('Aprobada',  filtroAprobadas));
    filtroRechazadas?.addEventListener('click', () => activarFiltro('Rechazada', filtroRechazadas));

    // =============================
    // 5. CERRAR SESIÓN
    // =============================
    document.getElementById('btn-logout-admin')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '../login/login.html';
    });

    // Iniciar carga de datos
    renderTablaSolicitudes();
});
