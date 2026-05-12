import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {

    // ELEMENTOS DEL DOM
    const requestTypeSelect = document.getElementById('request-type');
    const startDateInput    = document.getElementById('start-date');
    const endDateInput      = document.getElementById('end-date');
    const commentsInput     = document.getElementById('comments');
    const submitButton      = document.getElementById('btn-submit-request');
    const requestHistoryElement = document.getElementById('historial-solicitudes-tbody');
    const userNameHeader = document.getElementById('user-name-header');

    let userProfile = null;

    // ==========================================
    // 1. VERIFICAR SESIÓN Y CARGAR PERFIL
    // ==========================================
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        window.location.href = '../login/login.html';
        return;
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, nombre, empresa_id')
        .eq('id', session.user.id)
        .single();

    if (profile) {
        userProfile = profile;
        if (userNameHeader) userNameHeader.textContent = profile.nombre;
    }

    // ==========================================
    // 2. ENVIAR SOLICITUD A SUPABASE
    // ==========================================
    submitButton?.addEventListener('click', async (event) => {
        event.preventDefault();

        const type = requestTypeSelect.value;
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const comments = commentsInput.value;

        // Validaciones básicas
        if (!startDate || !endDate) {
            alert('Por favor, selecciona las fechas.');
            return;
        }

        if (endDate < startDate) {
            alert('La fecha de fin no puede ser anterior a la de inicio.');
            return;
        }

        // Insertar en la base de datos
        const { error } = await supabase
            .from('solicitudes')
            .insert([{
                usuario_id: userProfile.id,
                empresa_id: userProfile.empresa_id,
                tipo: type,
                fecha_inicio: startDate,
                fecha_fin: endDate,
                comentarios: comments,
                estado: 'Pendiente'
            }]);

        if (error) {
            alert('Error al enviar la solicitud: ' + error.message);
        } else {
            alert('Solicitud enviada con éxito.');
            resetForm();
            cargarHistorialSolicitudes();
        }
    });

    // ==========================================
    // 3. CARGAR HISTORIAL DESDE LA DB
    // ==========================================
    async function cargarHistorialSolicitudes() {
        if (!requestHistoryElement) return;

        const { data: solicitudes, error } = await supabase
            .from('solicitudes')
            .select('*')
            .eq('usuario_id', userProfile.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error cargando solicitudes:", error);
            return;
        }

        requestHistoryElement.innerHTML = '';

        if (solicitudes.length === 0) {
            requestHistoryElement.innerHTML = `
                <tr><td colspan="4" class="text-center">No tienes solicitudes registradas.</td></tr>`;
            return;
        }

        solicitudes.forEach(req => {
            let estadoClase = 'status-pending';
            if (req.estado === 'Aprobada')  estadoClase = 'status-completed'; // Usamos tus clases de color
            if (req.estado === 'Rechazada') estadoClase = 'status-issue';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${req.tipo}</td>
                <td>${formatFecha(req.fecha_inicio)}</td>
                <td>${formatFecha(req.fecha_fin)}</td>
                <td><span class="status-badge ${estadoClase}">${req.estado}</span></td>`;
            requestHistoryElement.appendChild(row);
        });
    }

    // ==========================================
    // UTILIDADES
    // ==========================================
    function resetForm() {
        startDateInput.value = '';
        endDateInput.value = '';
        commentsInput.value = '';
    }

    function formatFecha(fechaStr) {
        const opciones = { day: '2-digit', month: 'short', year: 'numeric' };
        return new Date(fechaStr).toLocaleDateString('es-ES', opciones);
    }

    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '../login/login.html';
    });

    // Carga inicial
    cargarHistorialSolicitudes();
});
