import { supabase } from '../js/supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {

    // =============================
    // ELEMENTOS DEL DOM
    // =============================
    const prevButton        = document.getElementById('btn-cal-prev');
    const nextButton        = document.getElementById('btn-cal-next');
    const monthYearDisplay  = document.getElementById('calendar-month-year');
    const calendarGridBody  = document.getElementById('calendar-grid-body');
    const btnNuevoProyecto  = document.getElementById('btn-nuevo-proyecto');
    const userNameHeader    = document.getElementById('user-name-header');
    
    // Selectores dinámicos
    const selectEmpleadoFiltro = document.getElementById('filtro-empleado-cal');
    const selectRolProy        = document.getElementById('proyecto-rol'); // NUEVO en tu HTML
    const selectEmpleadoProy   = document.getElementById('proyecto-empleado');

    // Modal proyecto
    const modalProyecto         = document.getElementById('modal-proyecto');
    const btnCerrarModalProy    = document.getElementById('btn-cerrar-modal-proyecto');
    const formProyecto          = document.getElementById('form-proyecto');
    const inputTituloProy       = document.getElementById('proyecto-titulo');
    const inputDescProy         = document.getElementById('proyecto-desc'); // NUEVO
    const inputStartProy        = document.getElementById('proyecto-start');
    const inputEndProy          = document.getElementById('proyecto-end');
    const inputColorProy        = document.getElementById('proyecto-color');

    // =============================
    // ESTADO GLOBAL
    // =============================
    let currentDate  = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear  = currentDate.getFullYear();
    let userProfile  = null;

    // =============================
    // CARGAR PERFIL E INICIO
    // =============================
    async function init() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return window.location.href = '../login/login.html';

        const { data: profile } = await supabase
            .from('profiles')
            .select('*, empresas(id, nombre)')
            .eq('id', session.user.id)
            .single();

        userProfile = profile;
        if (userNameHeader) userNameHeader.textContent = profile.nombre;

        await poblarSelectores();
        renderCalendar();
    }

    // =============================
    // POBLAR SELECTORES (EMPLEADOS Y ROLES)
    // =============================
    async function poblarSelectores() {
        // Cargar Empleados de la empresa
        const { data: empleados } = await supabase
            .from('profiles')
            .select('id, nombre')
            .eq('empresa_id', userProfile.empresa_id);

        // Cargar Roles (Maestros + Personalizados de la empresa)
        const { data: roles } = await supabase
            .from('roles')
            .select('*')
            .or(`empresa_id.is.null, empresa_id.eq.${userProfile.empresa_id}`);

        if (selectEmpleadoProy) {
            selectEmpleadoProy.innerHTML = '<option value="">Sin asignar (Personal/Global)</option>';
            empleados.forEach(emp => {
                const opt = new Option(emp.nombre, emp.id);
                selectEmpleadoProy.add(opt);
            });
        }

        if (selectRolProy) {
            selectRolProy.innerHTML = '<option value="">Todos los roles (Global)</option>';
            roles.forEach(rol => {
                const opt = new Option(rol.nombre_rol, rol.id);
                selectRolProy.add(opt);
            });
        }
    }

    // =============================
    // LÓGICA DEL CALENDARIO (GRID)
    // =============================
    function updateCalendarGrid(month, year) {
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        monthYearDisplay.textContent = `${monthNames[month]} ${year}`;

        calendarGridBody.querySelectorAll('.day-cell').forEach(cell => cell.remove());

        let firstDay = new Date(year, month, 1).getDay();
        firstDay = firstDay === 0 ? 7 : firstDay;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dayCellMap = new Map();

        for (let i = 1; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'day-cell other-month';
            calendarGridBody.appendChild(emptyCell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'day-cell';
            const dayNum = document.createElement('div');
            dayNum.className = 'day-number';
            dayNum.textContent = day;
            cell.appendChild(dayNum);

            if (day === currentDate.getDate() && month === currentDate.getMonth() && year === currentDate.getFullYear()) {
                cell.classList.add('today');
            }

            calendarGridBody.appendChild(cell);
            dayCellMap.set(day, cell);
        }
        return dayCellMap;
    }

    // =============================
    // PINTAR EVENTOS DESDE SUPABASE
    // =============================
    async function markEventos(month, year, dayCellMap) {
        // Consultar eventos filtrados por la empresa del Admin
        const { data: eventos, error } = await supabase
            .from('eventos_calendarios')
            .select('*, roles(nombre_rol)')
            .eq('empresa_id', userProfile.empresa_id);

        if (error) return;

        eventos.forEach(event => {
            const start = new Date(event.fecha_inicio);
            const end = new Date(event.fecha_fin);
            let d = new Date(start);

            while (d <= end) {
                if (d.getMonth() === month && d.getFullYear() === year) {
                    const cell = dayCellMap.get(d.getDate());
                    if (cell) {
                        const div = document.createElement('div');
                        div.className = 'calendar-event';
                        
                        // Etiqueta según si es global, por rol o personal
                        let etiqueta = event.roles ? `[${event.roles.nombre_rol}] ` : '';
                        div.textContent = etiqueta + event.titulo;
                        
                        div.style.backgroundColor = event.color_hex || '#6f42c1';
                        div.title = event.descripcion || '';
                        
                        cell.appendChild(div);
                    }
                }
                d.setDate(d.getDate() + 1);
            }
        });
    }

    function renderCalendar() {
        const dayCellMap = updateCalendarGrid(currentMonth, currentYear);
        markEventos(currentMonth, currentYear, dayCellMap);
    }

    // =============================
    // GUARDAR NUEVO PROYECTO/EVENTO
    // =============================
    async function guardarProyecto(e) {
        e.preventDefault();

        const nuevoEvento = {
            titulo: inputTituloProy.value,
            descripcion: inputDescProy ? inputDescProy.value : '',
            fecha_inicio: inputStartProy.value,
            fecha_fin: inputEndProy.value,
            color_hex: inputColorProy.value,
            empresa_id: userProfile.empresa_id,
            creado_por: userProfile.id,
            rol_destino_id: selectRolProy.value || null, // Si es nulo, es Global
            // categoria: selectEmpleadoProy.value ? 'Personal' : 'Global' // Opcional
        };

        const { error } = await supabase
            .from('eventos_calendarios')
            .insert([nuevoEvento]);

        if (error) {
            alert("Error al guardar el proyecto");
        } else {
            cerrarModalProyecto();
            renderCalendar();
        }
    }

    // =============================
    // NAVEGACIÓN Y MODALES
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

    function abrirModalProyecto() { modalProyecto?.classList.remove('modal-hidden'); }
    function cerrarModalProyecto() { 
        modalProyecto?.classList.add('modal-hidden'); 
        formProyecto.reset();
    }

    // Eventos
    prevButton?.addEventListener('click', goToPreviousMonth);
    nextButton?.addEventListener('click', goToNextMonth);
    btnNuevoProyecto?.addEventListener('click', abrirModalProyecto);
    btnCerrarModalProy?.addEventListener('click', cerrarModalProyecto);
    formProyecto?.addEventListener('submit', guardarProyecto);

    // Iniciar app
    init();
});
