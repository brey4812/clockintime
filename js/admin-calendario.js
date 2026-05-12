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
    
    // Selectores
    const selectRolProy       = document.getElementById('proyecto-rol');
    const selectEmpleadoProy  = document.getElementById('proyecto-empleado');

    // Modal proyecto
    const modalProyecto         = document.getElementById('modal-proyecto');
    const btnCerrarModalProy    = document.getElementById('btn-cerrar-modal-proyecto');
    const formProyecto          = document.getElementById('form-proyecto');
    const inputTituloProy       = document.getElementById('proyecto-titulo');
    const inputDescProy         = document.getElementById('proyecto-desc');
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
    // INICIO
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

    async function poblarSelectores() {
        const { data: empleados } = await supabase
            .from('profiles')
            .select('id, nombre')
            .eq('empresa_id', userProfile.empresa_id);

        const { data: roles } = await supabase
            .from('roles')
            .select('*')
            .or(`empresa_id.is.null, empresa_id.eq.${userProfile.empresa_id}`);

        if (selectEmpleadoProy) {
            selectEmpleadoProy.innerHTML = '<option value="">Sin asignar (Global/Empresa)</option>';
            empleados?.forEach(emp => {
                selectEmpleadoProy.add(new Option(emp.nombre, emp.id));
            });
        }

        if (selectRolProy) {
            selectRolProy.innerHTML = '<option value="">Todos los roles (Global)</option>';
            roles?.forEach(rol => {
                selectRolProy.add(new Option(rol.nombre_rol, rol.id));
            });
        }
    }

    // =============================
    // PINTAR EVENTOS (ADMIN VIEW)
    // =============================
    async function markEventos(month, year, dayCellMap) {
        // Consultamos la tabla 'eventos_calendario' (asegúrate que el nombre sea plural o singular según tu DB)
        const { data: eventos, error } = await supabase
            .from('eventos_calendario') 
            .select('*, roles(nombre_rol)')
            .eq('empresa_id', userProfile.empresa_id);

        if (error) {
            console.error("Error al obtener eventos:", error);
            return;
        }

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
                        let etiqueta = event.roles ? `[${event.roles.nombre_rol}] ` : '[Global] ';
                        div.textContent = etiqueta + event.titulo;
                        div.style.backgroundColor = event.color || event.color_hex || '#6f42c1';
                        div.title = event.descripcion || '';
                        cell.appendChild(div);
                    }
                }
                d.setDate(d.getDate() + 1);
            }
        });
    }

    // =============================
    // GUARDAR PROYECTO (FIXED)
    // =============================
    async function guardarProyecto(e) {
        e.preventDefault();

        // FIX: Sincronizamos los nombres de campos con los que espera la tabla
        const nuevoEvento = {
            titulo: inputTituloProy.value,
            descripcion: inputDescProy ? inputDescProy.value : '',
            fecha_inicio: inputStartProy.value,
            fecha_fin: inputEndProy.value,
            color: inputColorProy.value, // Cambiado de color_hex a color para ser uniforme
            empresa_id: userProfile.empresa_id,
            creado_por: userProfile.id,
            rol_id: selectRolProy.value || null, // Cambiado de rol_destino_id a rol_id
            user_id: selectEmpleadoProy ? (selectEmpleadoProy.value || null) : null
        };

        const { data, error } = await supabase
            .from('eventos_calendario')
            .insert([nuevoEvento]);

        if (error) {
            console.error("Error detallado de Supabase:", error);
            alert(`Error al guardar: ${error.message}`);
        } else {
            alert("Proyecto/Evento creado correctamente");
            cerrarModalProyecto();
            renderCalendar();
        }
    }

    // =============================
    // NAVEGACIÓN Y UTILS
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

    function renderCalendar() {
        const dayCellMap = updateCalendarGrid(currentMonth, currentYear);
        markEventos(currentMonth, currentYear, dayCellMap);
    }

    function abrirModalProyecto() { modalProyecto?.classList.remove('modal-hidden'); }
    function cerrarModalProyecto() { 
        modalProyecto?.classList.add('modal-hidden'); 
        formProyecto.reset();
    }

    prevButton?.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar();
    });

    nextButton?.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar();
    });

    btnNuevoProyecto?.addEventListener('click', abrirModalProyecto);
    btnCerrarModalProy?.addEventListener('click', cerrarModalProyecto);
    formProyecto?.addEventListener('submit', guardarProyecto);

    init();
});
