document.addEventListener("DOMContentLoaded", () => {

    const fichajesTbody = document.getElementById("fichajes-tbody");
    const btnFiltrar    = document.getElementById("btn-filter-fichajes");
    const inputDesde    = document.getElementById("start-date");
    const inputHasta    = document.getElementById("end-date");

    if (!fichajesTbody) return;

    // ==========================
    // UTILS
    // ==========================
    function secondsToHMS(totalSeconds) {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }

    function formatFecha(isoString) {
        if (!isoString) return '-';
        const d = new Date(isoString);
        return d.toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' });
    }

    // ==========================
    // CARGAR Y AGRUPAR FICHAJES
    // (filtramos por el email del empleado en sesión si está disponible)
    // ==========================
    function cargarFichajes(desde, hasta) {

        const currentEmail = localStorage.getItem('currentUserEmail');
        const fichajes     = JSON.parse(localStorage.getItem('workDays')) || [];

        // Filtramos por email si está disponible
        const propios = currentEmail
            ? fichajes.filter(f => !f.email || f.email === currentEmail)
            : fichajes;

        // Agrupamos por día (YYYY-MM-DD)
        const porDia = {};

        propios.forEach(f => {
            if (!f.date) return;
            const fecha = f.date.split('T')[0];

            // Aplicar filtro de fechas si se especificó
            if (desde && fecha < desde) return;
            if (hasta && fecha > hasta) return;

            if (!porDia[fecha]) {
                porDia[fecha] = {
                    startTime:    f.startTime   || '-',
                    endTime:      f.endTime     || '-',
                    totalSeconds: f.totalSeconds || 0,
                    pausedTime:   f.pausedTime   || 0
                };
            } else {
                // Si hay varios registros del mismo día, los acumulamos
                porDia[fecha].totalSeconds += (f.totalSeconds || 0);
                porDia[fecha].pausedTime   += (f.pausedTime   || 0);
                if (f.startTime && f.startTime < porDia[fecha].startTime) porDia[fecha].startTime = f.startTime;
                if (f.endTime   && f.endTime   > porDia[fecha].endTime)   porDia[fecha].endTime   = f.endTime;
            }
        });

        renderTabla(porDia);
    }

    // ==========================
    // PINTAR TABLA
    // ==========================
    function renderTabla(porDia) {

        fichajesTbody.innerHTML = '';

        const fechas = Object.keys(porDia).sort().reverse(); // más reciente primero

        if (fechas.length === 0) {
            fichajesTbody.innerHTML = `
                <tr><td colspan="6" class="text-center">No hay fichajes registrados.</td></tr>`;
            return;
        }

        fechas.forEach(fecha => {

            const data       = porDia[fecha];
            const totalHoras = secondsToHMS(data.totalSeconds);
            const pausas     = secondsToHMS(data.pausedTime);

            let estado      = 'Incidencia';
            let estadoClase = 'status-issue';

            if (data.totalSeconds >= 7 * 3600) {
                estado      = 'Completado';
                estadoClase = 'status-completed';
            }
            if (data.totalSeconds === 0) {
                estado      = 'Ausencia';
                estadoClase = 'status-off';
            }

            const row = document.createElement('tr');

            if (estado === 'Ausencia') {
                row.innerHTML = `
                    <td>${formatFecha(fecha + 'T00:00:00')}</td>
                    <td colspan="3" class="text-center">Vacaciones</td>
                    <td>${totalHoras}</td>
                    <td><span class="status-badge ${estadoClase}">${estado}</span></td>`;
            } else {
                row.innerHTML = `
                    <td>${formatFecha(fecha + 'T00:00:00')}</td>
                    <td>${data.startTime}</td>
                    <td>${data.endTime}</td>
                    <td>${pausas}</td>
                    <td>${totalHoras}</td>
                    <td><span class="status-badge ${estadoClase}">${estado}</span></td>`;
            }

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

    // ==========================
    // INIT
    // ==========================
    cargarFichajes('', '');
});
