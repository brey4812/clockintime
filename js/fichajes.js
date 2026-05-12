import { supabase } from './supabase-client.js';

document.addEventListener("DOMContentLoaded", async () => {

    const fichajesTbody = document.getElementById("fichajes-tbody");
    const btnFiltrar    = document.getElementById("btn-filter-fichajes");
    const inputDesde    = document.getElementById("start-date");
    const inputHasta    = document.getElementById("end-date");
    const userNameHeader = document.getElementById('user-name-header');

    // 1. VERIFICAR SESIÓN
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = '../login/login.html';
        return;
    }

    // Cargar nombre en el header
    const { data: profile } = await supabase
        .from('profiles')
        .select('nombre')
        .eq('id', session.user.id)
        .single();
    if (profile && userNameHeader) userNameHeader.textContent = profile.nombre;

    // ==========================
    // UTILS
    // ==========================
    function formatTimeDisplay(isoString) {
        if (!isoString) return '--:--';
        const d = new Date(isoString);
        return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }

    function formatFecha(dateString) {
        const d = new Date(dateString);
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function calcularDiferenciaHMS(entrada, salida) {
        if (!entrada || !salida) return "00:00:00";
        const diffMs = new Date(salida) - new Date(entrada);
        const totalSeconds = Math.floor(diffMs / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }

    // ==========================
    // CARGAR FICHAJES DESDE SUPABASE
    // ==========================
    async function cargarFichajes(desde = '', hasta = '') {
        if (!fichajesTbody) return;

        fichajesTbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando registros...</td></tr>';

        let query = supabase
            .from('jornadas')
            .select('*')
            .eq('usuario_id', session.user.id)
            .order('fecha', { ascending: false });

        // Filtros opcionales
        if (desde) query = query.gte('fecha', desde);
        if (hasta) query = query.lte('fecha', hasta);

        const { data: jornadas, error } = await query;

        if (error) {
            console.error("Error:", error);
            fichajesTbody.innerHTML = '<tr><td colspan="6" class="text-center">Error al cargar datos.</td></tr>';
            return;
        }

        renderTabla(jornadas);
    }

    // ==========================
    // PINTAR TABLA
    // ==========================
    function renderTabla(jornadas) {
        fichajesTbody.innerHTML = '';

        if (!jornadas || jornadas.length === 0) {
            fichajesTbody.innerHTML = '<tr><td colspan="6" class="text-center">No se encontraron fichajes en este rango.</td></tr>';
            return;
        }

        jornadas.forEach(j => {
            const row = document.createElement('tr');
            
            const horaEntrada = formatTimeDisplay(j.hora_entrada);
            const horaSalida = formatTimeDisplay(j.hora_salida);
            const tiempoTotal = j.hora_salida ? calcularDiferenciaHMS(j.hora_entrada, j.hora_salida) : 'En curso...';
            
            // Lógica de estado
            let estado = j.estado === 'completado' ? 'Completado' : 'Incidencia';
            let estadoClase = j.estado === 'completado' ? 'status-completed' : 'status-issue';
            
            if (!j.hora_salida) {
                estado = 'Activo';
                estadoClase = 'status-in';
            }

            row.innerHTML = `
                <td>${formatFecha(j.fecha)}</td>
                <td>${horaEntrada}</td>
                <td>${horaSalida}</td>
                <td>00:00:00</td> <td>${tiempoTotal}</td>
                <td><span class="status-badge ${estadoClase}">${estado}</span></td>
            `;

            fichajesTbody.appendChild(row);
        });
    }

    // ==========================
    // FILTRO POR FECHAS
    // ==========================
    btnFiltrar?.addEventListener('click', () => {
        const desde = inputDesde ? inputDesde.value : '';
        const hasta = inputHasta ? inputHasta.value : '';
        cargarFichajes(desde, hasta);
    });

    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '../login/login.html';
    });

    // INIT
    cargarFichajes();
});
