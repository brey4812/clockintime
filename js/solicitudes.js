import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {

    // ELEMENTOS DEL DOM
    const requestForm       = document.getElementById('request-form');
    const requestTypeSelect = document.getElementById('request-type');
    const startDateInput    = document.getElementById('start-date');
    const endDateInput      = document.getElementById('end-date');
    const commentsInput     = document.getElementById('comments');
    const requestHistory    = document.getElementById('historial-solicitudes-tbody');
    const userNameHeader    = document.getElementById('user-name-header');

    let userProfile = null;

    // ==========================================
    // 1. CARGA DE SESIÓN Y PERFIL
    // ==========================================
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        window.location.href = '../login/login.html';
        return;
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, nombre, empresa_id')
        .eq('id', session.user.id)
        .single();

    if (profile) {
        userProfile = profile;
        if (userNameHeader) userNameHeader.textContent = profile.nombre;
        cargarHistorial(); // Solo cargamos el historial tras tener el perfil
    }

    // ==========================================
    // 2. ENVIAR SOLICITUD (INSERT)
    // ==========================================
    requestForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validaciones de fechas
        if (endDateInput.value < startDateInput.value) {
            alert('La fecha de fin no puede ser anterior a la de inicio.');
            return;
        }

        const { error } = await supabase
            .from('solicitud') // Nombre exacto de tu tabla
            .insert([{
                user_id: userProfile.id,      // Usando user_id como dijiste
                empresa_id: userProfile.empresa_id,
                tipo: requestTypeSelect.value,
                fecha_inicio: startDateInput.value,
                fecha_fin: endDateInput.value,
                comentarios: commentsInput.value,
                estado: 'Pendiente'
            }]);

        if (error) {
            alert('Error al enviar: ' + error.message);
        } else {
            alert('Solicitud enviada correctamente.');
            requestForm.reset();
            cargarHistorial();
        }
    });

    // ==========================================
    // 3. CARGAR HISTORIAL (SELECT)
    // ==========================================
    async function cargarHistorial() {
        if (!requestHistory) return;

        const { data: solicitudes, error } = await supabase
            .from('solicitud')
            .select('*')
            .eq('user_id', userProfile.id) // Filtramos por tu user_id
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error cargando historial:", error);
            return;
        }

        requestHistory.innerHTML = '';

        if (solicitudes.length === 0) {
            requestHistory.innerHTML = '<tr><td colspan="4" class="text-center">No hay solicitudes.</td></tr>';
            return;
        }

        solicitudes.forEach(req => {
            // Asignación de colores según estado
            let claseBadge = 'status-pending';
            if (req.estado === 'Aprobada')  claseBadge = 'status-completed';
            if (req.estado === 'Rechazada') claseBadge = 'status-issue';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${req.tipo}</td>
                <td>${formatFecha(req.fecha_inicio)}</td>
                <td>${formatFecha(req.fecha_fin)}</td>
                <td><span class="status-badge ${claseBadge}">${req.estado}</span></td>
            `;
            requestHistory.appendChild(row);
        });
    }

    // ==========================================
    // UTILIDADES
    // ==========================================
    function formatFecha(str) {
        const d = new Date(str);
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '../login/login.html';
    });
});
