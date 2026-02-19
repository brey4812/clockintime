document.addEventListener('DOMContentLoaded', () => {

    // =============================
    // ELEMENTOS DEL DOM
    // =============================
    const prevButton = document.getElementById('btn-cal-prev');
    const nextButton = document.getElementById('btn-cal-next');
    const monthYearDisplay = document.getElementById('calendar-month-year');
    const calendarGridBody = document.getElementById('calendar-grid-body');

    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    // =============================
    // COLORES POR ESTADO
    // =============================
    const eventColors = {
        'Pendiente': '#f5a623',
        'Oficina': '#4a90e2',
        'Otro': '#28a745'
    };

    // =============================
    // CREAR CALENDARIO
    // =============================
    function updateCalendar(month, year) {

        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        monthYearDisplay.textContent = `${monthNames[month]} ${year}`;

        calendarGridBody
            .querySelectorAll('.day-cell')
            .forEach(cell => cell.remove());

        let firstDay = new Date(year, month, 1).getDay();
        firstDay = firstDay === 0 ? 7 : firstDay;

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dayCellMap = new Map();

        // Huecos iniciales
        for (let i = 1; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'day-cell other-month';
            calendarGridBody.appendChild(emptyCell);
        }

        // Días del mes
        for (let day = 1; day <= daysInMonth; day++) {

            const cell = document.createElement('div');
            cell.className = 'day-cell';

            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            cell.appendChild(dayNumber);

            if (
                day === currentDate.getDate() &&
                month === currentDate.getMonth() &&
                year === currentDate.getFullYear()
            ) {
                cell.classList.add('today');
            }

            calendarGridBody.appendChild(cell);
            dayCellMap.set(day, cell);
        }

        return dayCellMap;
    }

    // =============================
    // PARSE FECHA LOCAL
    // =============================
    function parseLocalDate(dateStr) {
        const [y, m, d] = dateStr.split('-');
        return new Date(y, m - 1, d);
    }

    // =============================
    // MARCAR EVENTOS Y SOLICITUDES
    // =============================
    function markRequestsAndEvents(month, year, dayCellMap) {

        // Limpiar eventos previos
        document.querySelectorAll('.calendar-event').forEach(e => e.remove());

        const solicitudes = JSON.parse(localStorage.getItem('solicitudes')) || [];
        const eventos = JSON.parse(localStorage.getItem('eventos')) || [];

        // Unificamos sin perder información
        const items = [
            ...solicitudes.map(s => ({
                ...s,
                category: 'Solicitud'
            })),
            ...eventos.map(e => ({
                ...e,
                category: 'Evento'
            }))
        ];

        items.forEach(item => {

            if (item.estado && item.estado.toLowerCase() === 'rejected') return;
            if (!item.startDate || !item.endDate) return;

            const start = parseLocalDate(item.startDate);
            const end = parseLocalDate(item.endDate);
            let d = new Date(start);

            while (d <= end) {

                if (d.getMonth() === month && d.getFullYear() === year) {

                    const cell = dayCellMap.get(d.getDate());
                    if (cell) {

                        const note = document.createElement('div');
                        note.className = 'calendar-event';

                        // TEXTO: categoría + tipo real
                        const tipoTexto = item.type  ? `: ${item.type }` : '';
                        note.textContent = `${item.category}${tipoTexto}`;

                        // Color por estado
                        let color = eventColors['Otro'];
                        if (item.estado === 'Pendiente') color = eventColors['Pendiente'];
                        else if (item.estado === 'Oficina') color = eventColors['Oficina'];

                        note.style.backgroundColor = color;
                        note.title = note.textContent;

                        // Estilos inline para soportar múltiples eventos sin tocar CSS
                        note.style.fontSize = '0.65rem';
                        note.style.marginTop = '2px';
                        note.style.padding = '2px 4px';
                        note.style.borderRadius = '4px';
                        note.style.whiteSpace = 'nowrap';
                        note.style.overflow = 'hidden';
                        note.style.textOverflow = 'ellipsis';

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
        markRequestsAndEvents(currentMonth, currentYear, dayCellMap);
    }

    // =============================
    // NAVEGACIÓN
    // =============================
    function goToPreviousMonth() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    }

    function goToNextMonth() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    }

    prevButton?.addEventListener('click', goToPreviousMonth);
    nextButton?.addEventListener('click', goToNextMonth);

    // =============================
    // RENDER INICIAL
    // =============================
    renderCalendar();
});
