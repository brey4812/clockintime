document.addEventListener('DOMContentLoaded', () => {

    // =============================
    // ELEMENTOS DEL DOM
    // =============================
    const prevButton       = document.getElementById('btn-cal-prev');
    const nextButton       = document.getElementById('btn-cal-next');
    const monthYearDisplay = document.getElementById('calendar-month-year');
    const calendarGridBody = document.getElementById('calendar-grid-body');

    let currentDate  = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear  = currentDate.getFullYear();

    // =============================
    // COLORES POR ESTADO / CATEGORÍA
    // =============================
    const eventColors = {
        'Pendiente': '#f5a623',
        'Aprobada':  '#28a745',
        'Rechazada': '#dc3545',
        'Proyecto':  '#6f42c1',
        'default':   '#4a90e2'
    };

    // =============================
    // CONSTRUIR EL GRID DEL MES
    // =============================
    function updateCalendar(month, year) {

        const monthNames = [
            'Enero','Febrero','Marzo','Abril','Mayo','Junio',
            'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
        ];

        if (monthYearDisplay) monthYearDisplay.textContent = `${monthNames[month]} ${year}`;

        // Eliminamos solo las celdas de días, no los headers
        calendarGridBody.querySelectorAll('.day-cell').forEach(c => c.remove());

        let firstDay = new Date(year, month, 1).getDay();
        firstDay = firstDay === 0 ? 7 : firstDay;

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dayCellMap  = new Map();

        // Huecos vacíos antes del día 1
        for (let i = 1; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'day-cell other-month';
            calendarGridBody.appendChild(empty);
        }

        // Celdas de días reales
        for (let day = 1; day <= daysInMonth; day++) {

            const cell = document.createElement('div');
            cell.className = 'day-cell';

            const num = document.createElement('div');
            num.className   = 'day-number';
            num.textContent = day;
            cell.appendChild(num);

            if (
                day === currentDate.getDate() &&
                month === currentDate.getMonth() &&
                year  === currentDate.getFullYear()
            ) {
                cell.classList.add('today');
            }

            calendarGridBody.appendChild(cell);
            dayCellMap.set(day, cell);
        }

        return dayCellMap;
    }

    // =============================
    // PARSE DE FECHA LOCAL (sin desfase de zona horaria)
    // =============================
    function parseLocalDate(dateStr) {
        if (!dateStr) return null;
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    // =============================
    // PINTAR EVENTOS EN EL CALENDARIO
    // (lee solicitudes aprobadas y eventos/proyectos del empleado en sesión)
    // =============================
    function markEventos(month, year, dayCellMap) {

        // Limpiamos eventos anteriores
        calendarGridBody.querySelectorAll('.calendar-event').forEach(e => e.remove());

        const currentEmail = localStorage.getItem('currentUserEmail') || '';

        // Solicitudes individuales del empleado (aprobadas o pendientes)
        const keySolicitudes = currentEmail ? `solicitudes_${currentEmail}` : null;
        const solicitudes    = keySolicitudes
            ? (JSON.parse(localStorage.getItem(keySolicitudes)) || [])
            : [];

        // Eventos y proyectos asignados por el jefe
        const keyEventos = currentEmail ? `eventos_${currentEmail}` : null;
        const eventos    = keyEventos
            ? (JSON.parse(localStorage.getItem(keyEventos)) || [])
            : [];

        const items = [
            ...solicitudes.map(s => ({ ...s, _fuente: 'solicitud' })),
            ...eventos.map(e     => ({ ...e, _fuente: 'evento'    }))
        ];

        items.forEach(item => {

            // Omitimos rechazadas
            if (item.estado && item.estado.toLowerCase() === 'rechazada') return;
            if (!item.startDate || !item.endDate) return;

            const start = parseLocalDate(item.startDate);
            const end   = parseLocalDate(item.endDate);
            if (!start || !end) return;

            let d = new Date(start);

            while (d <= end) {

                if (d.getMonth() === month && d.getFullYear() === year) {

                    const cell = dayCellMap.get(d.getDate());

                    if (cell) {
                        const note = document.createElement('div');
                        note.className = 'calendar-event';

                        // Texto del evento
                        const categoria  = item.category || (item._fuente === 'solicitud' ? 'Solicitud' : 'Evento');
                        const tipoTexto  = item.type ? `: ${item.type}` : '';
                        note.textContent = `${categoria}${tipoTexto}`;
                        note.title       = note.textContent;

                        // Color
                        let color = eventColors['default'];
                        if (item.color)                       color = item.color;
                        else if (item.category === 'Proyecto') color = eventColors['Proyecto'];
                        else if (item.estado === 'Aprobada')   color = eventColors['Aprobada'];
                        else if (item.estado === 'Pendiente')  color = eventColors['Pendiente'];

                        note.style.backgroundColor = color;
                        note.style.color           = '#fff';
                        note.style.fontSize        = '0.68rem';
                        note.style.marginTop       = '2px';
                        note.style.padding         = '2px 5px';
                        note.style.borderRadius    = '4px';
                        note.style.whiteSpace      = 'nowrap';
                        note.style.overflow        = 'hidden';
                        note.style.textOverflow    = 'ellipsis';

                        cell.appendChild(note);
                    }
                }

                d.setDate(d.getDate() + 1);
            }
        });
    }

    // =============================
    // RENDER COMPLETO
    // =============================
    function renderCalendar() {
        const dayCellMap = updateCalendar(currentMonth, currentYear);
        markEventos(currentMonth, currentYear, dayCellMap);
    }

    // =============================
    // NAVEGACIÓN
    // =============================
    function goToPreviousMonth() {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar();
    }

    function goToNextMonth() {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar();
    }

    prevButton?.addEventListener('click', goToPreviousMonth);
    nextButton?.addEventListener('click', goToNextMonth);

    // =============================
    // INIT
    // =============================
    renderCalendar();
});
