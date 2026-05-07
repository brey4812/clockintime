document.addEventListener('DOMContentLoaded', () => {

    // =============================
    // ELEMENTOS DEL DOM
    // =============================
    const prevButton        = document.getElementById('btn-cal-prev');
    const nextButton        = document.getElementById('btn-cal-next');
    const monthYearDisplay  = document.getElementById('calendar-month-year');
    const calendarGridBody  = document.getElementById('calendar-grid-body');
    const btnNuevoProyecto  = document.getElementById('btn-nuevo-proyecto');
    const userNameHeader    = document.getElementById('user-name-header');
    const selectEmpleadoFiltro = document.getElementById('filtro-empleado-cal');

    // Modal proyecto
    const modalProyecto         = document.getElementById('modal-proyecto');
    const btnCerrarModalProy    = document.getElementById('btn-cerrar-modal-proyecto');
    const formProyecto          = document.getElementById('form-proyecto');
    const inputTituloProy       = document.getElementById('proyecto-titulo');
    const inputStartProy        = document.getElementById('proyecto-start');
    const inputEndProy          = document.getElementById('proyecto-end');
    const selectEmpleadoProy    = document.getElementById('proyecto-empleado');
    const inputColorProy        = document.getElementById('proyecto-color');

    // =============================
    // ESTADO DE NAVEGACIÓN
    // =============================
    let currentDate  = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear  = currentDate.getFullYear();

    // =============================
    // COLORES POR CATEGORÍA
    // =============================
    const eventColors = {
        'Pendiente': '#f5a623',
        'Aprobada':  '#28a745',
        'Rechazada': '#dc3545',
        'Proyecto':  '#6f42c1',
        'Solicitud': '#28a745',
        'Otro':      '#4a90e2'
    };

    // =============================
    // CARGAR JEFE ACTUAL
    // =============================
    function getJefeActual() {
        const email = localStorage.getItem('currentUserEmail');
        if (!email) return null;
        return JSON.parse(localStorage.getItem(email));
    }

    // =============================
    // OBTENER EMAILS DE EMPLEADOS
    // =============================
    function getEmailsEmpleados() {

        const jefe = getJefeActual();
        if (!jefe) return [];

        const empresas = JSON.parse(localStorage.getItem('empresas')) || [];
        const empresa  = empresas.find(e => e.code === jefe.companyCode);

        return empresa ? empresa.employees : [];
    }

    // =============================
    // PARSEAR FECHA LOCAL
    // (evitamos desfases de zona horaria al crear la fecha desde string)
    // =============================
    function parseLocalDate(dateStr) {
        const [y, m, d] = dateStr.split('-');
        return new Date(y, m - 1, d);
    }

    // =============================
    // CONSTRUIR EL GRID DEL CALENDARIO
    // (creamos las celdas del mes y devolvemos un mapa dia->celda para luego pintarle eventos)
    // =============================
    function updateCalendar(month, year) {

        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        monthYearDisplay.textContent = `${monthNames[month]} ${year}`;

        // Eliminamos celdas de días anteriores pero dejamos los encabezados
        calendarGridBody.querySelectorAll('.day-cell').forEach(cell => cell.remove());

        let firstDay = new Date(year, month, 1).getDay();
        firstDay = firstDay === 0 ? 7 : firstDay;

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dayCellMap  = new Map();

        // Huecos vacíos antes del primer día
        for (let i = 1; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'day-cell other-month';
            calendarGridBody.appendChild(emptyCell);
        }

        // Celdas de los días del mes
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
    // PINTAR EVENTOS EN EL CALENDARIO
    // (recorremos solicitudes aprobadas y proyectos de cada empleado y los mostramos)
    // =============================
    function markEventos(month, year, dayCellMap) {

        // Limpiamos eventos previos
        document.querySelectorAll('.calendar-event').forEach(e => e.remove());

        const emails       = getEmailsEmpleados();
        const filtroEmail  = selectEmpleadoFiltro ? selectEmpleadoFiltro.value : 'todos';
        const emailsAMostrar = filtroEmail === 'todos' ? emails : [filtroEmail];

        emailsAMostrar.forEach(email => {

            const userData  = localStorage.getItem(email);
            const empleado  = userData ? JSON.parse(userData) : null;
            const nombreEmp = empleado ? (empleado.fullname || email) : email;

            // Eventos del empleado (solicitudes aprobadas y proyectos)
            const keyEventos = `eventos_${email}`;
            const eventos    = JSON.parse(localStorage.getItem(keyEventos)) || [];

            // También miramos las solicitudes aprobadas que vienen de la lista global
            const solicitudesGlobales = JSON.parse(localStorage.getItem('solicitudes')) || [];
            const solicitudesAprobadas = solicitudesGlobales.filter(s =>
                s.emailEmpleado === email && s.estado === 'Aprobada'
            );

            const items = [
                ...eventos,
                ...solicitudesAprobadas.map(s => ({ ...s, category: s.category || 'Solicitud' }))
            ];

            items.forEach(item => {

                if (!item.startDate || !item.endDate) return;
                if (item.estado && item.estado.toLowerCase() === 'rechazada') return;

                const start = parseLocalDate(item.startDate);
                const end   = parseLocalDate(item.endDate);
                let d       = new Date(start);

                while (d <= end) {

                    if (d.getMonth() === month && d.getFullYear() === year) {

                        const cell = dayCellMap.get(d.getDate());
                        if (cell) {

                            const note = document.createElement('div');
                            note.className = 'calendar-event';

                            const categoria = item.category || 'Otro';
                            const tipoTexto = item.type ? `: ${item.type}` : '';
                            note.textContent = `${nombreEmp} – ${categoria}${tipoTexto}`;
                            note.title       = note.textContent;

                            // Color: proyectos en morado, solicitudes aprobadas en verde, pendientes en naranja
                            let color = eventColors['Otro'];
                            if (categoria === 'Proyecto')          color = eventColors['Proyecto'];
                            else if (item.color)                   color = item.color;
                            else if (item.estado === 'Aprobada')   color = eventColors['Aprobada'];
                            else if (item.estado === 'Pendiente')  color = eventColors['Pendiente'];
                            else if (item.estado === 'Rechazada')  color = eventColors['Rechazada'];

                            note.style.backgroundColor = color;
                            note.style.fontSize        = '0.65rem';
                            note.style.marginTop       = '2px';
                            note.style.padding         = '2px 4px';
                            note.style.borderRadius    = '4px';
                            note.style.whiteSpace      = 'nowrap';
                            note.style.overflow        = 'hidden';
                            note.style.textOverflow    = 'ellipsis';
                            note.style.color           = '#fff';

                            cell.appendChild(note);
                        }
                    }

                    d.setDate(d.getDate() + 1);
                }
            });
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
    // NAVEGACIÓN DEL CALENDARIO
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

    // =============================
    // POBLAR SELECTOR DE EMPLEADOS
    // (rellenamos el select del modal de proyecto y el filtro con los empleados de la empresa)
    // =============================
    function poblarSelectoresEmpleados() {

        const emails   = getEmailsEmpleados();

        // Select del modal de proyecto
        if (selectEmpleadoProy) {
            selectEmpleadoProy.innerHTML = '<option value="todos">Todos los empleados</option>';
            emails.forEach(email => {
                const userData = localStorage.getItem(email);
                const emp      = userData ? JSON.parse(userData) : null;
                const nombre   = emp ? (emp.fullname || email) : email;
                const option   = document.createElement('option');
                option.value   = email;
                option.textContent = nombre;
                selectEmpleadoProy.appendChild(option);
            });
        }

        // Select del filtro del calendario
        if (selectEmpleadoFiltro) {
            selectEmpleadoFiltro.innerHTML = '<option value="todos">Todos</option>';
            emails.forEach(email => {
                const userData = localStorage.getItem(email);
                const emp      = userData ? JSON.parse(userData) : null;
                const nombre   = emp ? (emp.fullname || email) : email;
                const option   = document.createElement('option');
                option.value   = email;
                option.textContent = nombre;
                selectEmpleadoFiltro.appendChild(option);
            });
        }
    }

    // =============================
    // GUARDAR PROYECTO
    // (guardamos el proyecto en el calendario del empleado o de todos si se selecciona "todos")
    // =============================
    function guardarProyecto(event) {

        event.preventDefault();

        const titulo    = inputTituloProy  ? inputTituloProy.value.trim()  : '';
        const startDate = inputStartProy   ? inputStartProy.value          : '';
        const endDate   = inputEndProy     ? inputEndProy.value            : '';
        const emailEmp  = selectEmpleadoProy ? selectEmpleadoProy.value    : 'todos';
        const color     = inputColorProy   ? inputColorProy.value          : '#6f42c1';

        if (!titulo || !startDate || !endDate) {
            alert('Por favor completa todos los campos obligatorios.');
            return;
        }

        if (endDate < startDate) {
            alert('La fecha de fin no puede ser anterior a la fecha de inicio.');
            return;
        }

        const nuevoEvento = {
            type:      titulo,
            startDate: startDate,
            endDate:   endDate,
            estado:    'Aprobada',
            category:  'Proyecto',
            color:     color
        };

        const emails = getEmailsEmpleados();

        // Si se seleccionó "todos", añadimos el proyecto a todos los empleados
        const destinatarios = emailEmp === 'todos' ? emails : [emailEmp];

        destinatarios.forEach(email => {
            const keyEventos = `eventos_${email}`;
            const eventos    = JSON.parse(localStorage.getItem(keyEventos)) || [];
            eventos.push(nuevoEvento);
            localStorage.setItem(keyEventos, JSON.stringify(eventos));
        });

        alert(`Proyecto "${titulo}" añadido al calendario correctamente.`);

        cerrarModalProyecto();
        renderCalendar();
    }

    // =============================
    // CONTROL DEL MODAL PROYECTO
    // =============================
    function abrirModalProyecto() {
        if (modalProyecto) modalProyecto.classList.remove('modal-hidden');
    }

    function cerrarModalProyecto() {
        if (modalProyecto) modalProyecto.classList.add('modal-hidden');
        if (formProyecto) formProyecto.reset();
    }

    // =============================
    // CARGAR NOMBRE DEL JEFE EN HEADER
    // =============================
    function cargarNombreHeader() {
        const jefe = getJefeActual();
        if (jefe && userNameHeader) {
            userNameHeader.textContent = jefe.fullname || jefe.email;
        }
    }

    // =============================
    // EVENTOS PRINCIPALES
    // =============================
    prevButton?.addEventListener('click', goToPreviousMonth);
    nextButton?.addEventListener('click', goToNextMonth);
    btnNuevoProyecto?.addEventListener('click', abrirModalProyecto);
    btnCerrarModalProy?.addEventListener('click', cerrarModalProyecto);
    formProyecto?.addEventListener('submit', guardarProyecto);
    selectEmpleadoFiltro?.addEventListener('change', renderCalendar);

    // Cerrar modal al hacer clic en el overlay
    modalProyecto?.addEventListener('click', (e) => {
        if (e.target === modalProyecto) cerrarModalProyecto();
    });

    // =============================
    // INIT
    // =============================
    cargarNombreHeader();
    poblarSelectoresEmpleados();
    renderCalendar();
});
