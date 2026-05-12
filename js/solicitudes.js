import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {

    // ==========================================
    // ELEMENTOS DEL DOM
    // ==========================================
    const requestForm       = document.getElementById('request-form');
    const requestTypeSelect = document.getElementById('request-type');
    const startDateInput    = document.getElementById('start-date');
    const endDateInput      = document.getElementById('end-date');
    const commentsInput     = document.getElementById('comments');
    const requestHistory    = document.getElementById('historial-solicitudes-tbody');
    const userNameHeader    = document.getElementById('user-name-header');
    const btnLogout         = document.getElementById('btn-logout');

    let userProfile = null;

    // ==========================================
    // 1. CARGA DE SESIÓN Y PERFIL (NOMBRE REAL)
    // ==========================================
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        window.location.href = '../login/login.html';
        return;
    }

    // Obtenemos los datos del perfil para el Header y para los IDs de la tabla
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, nombre, empresa_id')
        .eq('id', session.user.id)
        .single();

    if (profile) {
        userProfile = profile;
        if (userNameHeader) userNameHeader.textContent = profile.nombre;
        cargarHistorial(); // Cargamos la tabla una vez tenemos el perfil
    } else if (profileError) {
        console.error("Error al cargar perfil:", profileError.message);
    }

    // ==========================================
    // 2. ENVIAR SOLICITUD (INSERT EN DB)
    // ==========================================
    requestForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validaciones preventivas
        if (!startDateInput.value || !endDateInput.value) {
            alert('Por favor, selecciona ambas fechas.');
            return;
        }

        if (endDateInput.value < startDateInput.value) {
            alert('La fecha de fin no puede ser anterior a la de inicio.');
            return;
        }

        // Inserción en la tabla 'solicitudes'
        const { error } = await supabase
            .from('solicitudes') 
            .insert([{
                user_id: userProfile.id,      // Tu columna en DB: user_id
                empresa_id: userProfile.empresa_id,
                tipo: requestTypeSelect.value,
                fecha_inicio: startDateInput.value,
                fecha_fin: endDateInput.value,
                comentarios: commentsInput.value,
                estado: 'Pendiente'
            }]);

        if (error) {
            console.error("Error de Supabase:", error);
            alert('Error al enviar la solicitud: ' + error.message);
        } else {
            alert('Solicitud enviada correctamente.');
            requestForm.reset();
            cargarHistorial(); // Refrescamos la tabla automáticamente
        }
    });

    // ==========================================
    // 3. CARGAR HISTORIAL (SELECT DESDE DB)
    // ==========================================
    async function cargarHistorial() {
        if (!requestHistory || !userProfile) return;

        const { data: solicitudes, error } = await supabase
            .from('solicitudes')
            .select('*')
            .eq('user_id', userProfile.id) // Filtramos por tu columna user_id
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error cargando historial:", error);
            return;
        }

        requestHistory.innerHTML = '';

        if (!solicitudes || solicitudes.length === 0) {
            requestHistory.innerHTML = '<tr><td colspan="4" class="text-center">No tienes solicitudes registradas.</td></tr>';
            return;
        }

        solicitudes.forEach(req => {
            // Asignación de colores según el estado que viene de la base de datos
            let claseBadge = 'status-pending';
            if (req.estado === 'Aprobada')  claseBadge = 'status-completed'; // Verde
            if (req.estado === 'Rechazada') claseBadge = 'status-issue';     // Rojo

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${req.tipo || '-'}</td>
                <td>${formatFecha(req.fecha_inicio)}</td>
                <td>${formatFecha(req.fecha_fin)}</td>
                <td><span class="status-badge ${claseBadge}">${req.estado || 'Pendiente'}</span></td>
            `;
            requestHistory.appendChild(row);
        });
    }

    // ==========================================
    // UTILIDADES
    // ==========================================
    function formatFecha(str) {
        if (!str) return '-';
        const d = new Date(str);
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    // Lógica de Cierre de Sesión
    btnLogout?.addEventListener('click', async (e) => {
        e.preventDefault();
        const { error } = await supabase.auth.signOut();
        if (!error) window.location.href = '../login/login.html';
    });

});
