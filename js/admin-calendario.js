import { supabase } from '../js/supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    // ELEMENTOS DEL DOM
    const selectEmpleadoFiltro = document.getElementById('filtro-empleado-cal');
    const selectEmpleadoProy  = document.getElementById('proyecto-empleado');
    const selectRolProy       = document.getElementById('proyecto-rol');
    const userNameHeader      = document.getElementById('user-name-header');
    const calendarGridBody    = document.getElementById('calendar-grid-body');
    const monthYearDisplay    = document.getElementById('calendar-month-year');

    let currentMonth = new Date().getMonth();
    let currentYear  = new Date().getFullYear();
    let userProfile  = null;
    let filtroActual = 'todos'; // ID del empleado o 'todos'

    // 1. INICIALIZACIÓN
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return window.location.href = '../login/login.html';

    const { data: profile } = await supabase
        .from('profiles')
        .select('*, empresas(id)')
        .eq('id', session.user.id)
        .single();

    if (profile) {
        userProfile = profile;
        userNameHeader.textContent = profile.nombre;
        await cargarFiltros();
        renderCalendar();
    }

    // 2. CARGAR EMPLEADOS Y ROLES (Corregido)
    async function cargarFiltros() {
        // Obtenemos todos los perfiles de la misma empresa
        const { data: empleados, error } = await supabase
            .from('profiles')
            .select('id, nombre')
            .eq('empresa_id', userProfile.empresa_id);

        if (error) return console.error("Error cargando empleados:", error);

        // Limpiar y poblar selectores
        [selectEmpleadoFiltro, selectEmpleadoProy].forEach(select => {
            if (!select) return;
            const defaultText = select.id === 'filtro-empleado-cal' ? 'Todos los empleados' : 'Sin asignar (Global)';
            select.innerHTML = `<option value="todos">${defaultText}</option>`;
            
            empleados.forEach(emp => {
                const opt = document.createElement('option');
                opt.value = emp.id;
                opt.textContent = emp.nombre;
                select.appendChild(opt);
            });
        });

        // Poblar Roles
        const { data: roles } = await supabase
            .from('roles')
            .select('*')
            .or(`empresa_id.is.null,empresa_id.eq.${userProfile.empresa_id}`);

        if (selectRolProy) {
            selectRolProy.innerHTML = '<option value="">Todos los roles (Global)</option>';
            roles?.forEach(rol => {
                selectRolProy.add(new Option(rol.nombre_rol, rol.id));
            });
        }
    }

    // 3. LÓGICA DE FILTRADO
    selectEmpleadoFiltro?.addEventListener('change', (e) => {
        filtroActual = e.target.value;
        renderCalendar(); // Volver a pintar con el filtro
    });

    async function markEventos(month, year, dayCellMap) {
        let query = supabase
            .from('eventos_calendario')
            .select('*, roles(nombre_rol)')
            .eq('empresa_id', userProfile.empresa_id);

        // APLICAR FILTRO SI NO ES 'TODOS'
        if (filtroActual !== 'todos') {
            query = query.eq('user_id', filtroActual);
        }

        const { data: eventos } = await query;

        // Pintar eventos en el grid (lógica de bucle d <= end...)
        eventos?.forEach(event => {
            const start = new Date(event.fecha_inicio);
            const end = new Date(event.fecha_fin);
            let d = new Date(start);
            while (d <= end) {
                if (d.getMonth() === month && d.getFullYear() === year) {
                    const cell = dayCellMap.get(d.getDate());
                    if (cell) {
                        const div = document.createElement('div');
                        div.className = 'calendar-event';
                        div.style.backgroundColor = event.color || '#6f42c1';
                        div.textContent = event.titulo;
                        cell.appendChild(div);
                    }
                }
                d.setDate(d.getDate() + 1);
            }
        });
    }

    // --- FUNCIONES DE RENDER (updateCalendarGrid, etc.) ---
    function renderCalendar() {
        const dayCellMap = updateCalendarGrid(currentMonth, currentYear);
        markEventos(currentMonth, currentYear, dayCellMap);
    }

    function updateCalendarGrid(month, year) {
        const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        monthYearDisplay.textContent = `${monthNames[month]} ${year}`;
        calendarGridBody.querySelectorAll('.day-cell').forEach(c => c.remove());

        let firstDay = new Date(year, month, 1).getDay();
        firstDay = firstDay === 0 ? 7 : firstDay;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dayCellMap = new Map();

        for (let i = 1; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'day-cell other-month';
            calendarGridBody.appendChild(empty);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'day-cell';
            const num = document.createElement('div');
            num.className = 'day-number';
            num.textContent = day;
            cell.appendChild(num);
            calendarGridBody.appendChild(cell);
            dayCellMap.set(day, cell);
        }
        return dayCellMap;
    }

    // Navegación
    document.getElementById('btn-cal-prev').onclick = () => { currentMonth--; if(currentMonth < 0){currentMonth=11; currentYear--;} renderCalendar(); };
    document.getElementById('btn-cal-next').onclick = () => { currentMonth++; if(currentMonth > 11){currentMonth=0; currentYear++;} renderCalendar(); };
    
    init();
});
