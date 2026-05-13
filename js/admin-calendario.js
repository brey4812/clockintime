import { supabase } from '../js/supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    // =============================
    // ELEMENTOS DEL DOM
    // =============================
    const selectEmpleadoFiltro = document.getElementById('filtro-empleado-cal');
    const selectEmpleadoProy  = document.getElementById('proyecto-empleado');
    const selectRolProy       = document.getElementById('proyecto-rol');
    const userNameHeader      = document.getElementById('user-name-header');
    const calendarGridBody    = document.getElementById('calendar-grid-body');
    const monthYearDisplay    = document.getElementById('calendar-month-year');
    
    const prevButton          = document.getElementById('btn-cal-prev');
    const nextButton          = document.getElementById('btn-cal-next');

    // Modal y Formulario
    const btnNuevoProyecto    = document.getElementById('btn-nuevo-proyecto');
    const modalProyecto       = document.getElementById('modal-proyecto');
    const btnCerrarModalProy  = document.getElementById('btn-cerrar-modal-proyecto');
    const formProyecto        = document.getElementById('form-proyecto');

    // Inputs Formulario
    const inputTituloProy     = document.getElementById('proyecto-titulo');
    const inputDescProy       = document.getElementById('proyecto-desc');
    const inputStartProy      = document.getElementById('proyecto-start');
    const inputEndProy        = document.getElementById('proyecto-end');
    const inputColorProy      = document.getElementById('proyecto-color');

    // =============================
    // ESTADO GLOBAL
    // =============================
    let currentMonth = new Date().getMonth();
    let currentYear  = new Date().getFullYear();
    let userProfile  = null;
    let filtroActual = 'todos'; 

    // =============================
    // 1. INICIALIZACIÓN
    // =============================
    async function init() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return window.location.href = '../login/login.html';

        const { data: profile } = await supabase
            .from('profiles')
            .select('*, empresas(id)')
            .eq('id', session.user.id)
            .single();

        if (profile) {
            userProfile = profile;
            if (userNameHeader) userNameHeader.textContent = profile.nombre;
            await cargarFiltros();
            renderCalendar();
        }
    }

    // =============================
    // 2. CARGAR SELECTORES (EMPLEADOS Y ROLES)
    // =============================
    async function cargarFiltros() {
        const { data: empleados, error } = await supabase
            .from('profiles')
            .select('id, nombre')
            .eq('empresa_id', userProfile.empresa_id);

        if (error) return console.error("Error cargando empleados:", error);

        // Poblar selectores de empleados (Tanto el filtro superior como el del modal)
        [selectEmpleadoFiltro, selectEmpleadoProy].forEach(select => {
            if (!select) return;
            const isFiltro = select.id === 'filtro-empleado-cal';
            select.innerHTML = isFiltro 
                ? `<option value="todos">Todos los empleados</option>` 
                : `<option value="">Sin asignar (Global / Empresa)</option>`;
            
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

    // =============================
    // 3. PINTAR EVENTOS (GLOBAL + FILTRADO)
    // =============================
    async function markEventos(month, year, dayCellMap) {
        let query = supabase
            .from('eventos_calendario')
            .select('*, roles(nombre_rol)')
            .eq('empresa_id', userProfile.empresa_id);

        // LÓGICA DE FILTRO: 
        // Si se elige un empleado, vemos: lo suyo + lo que es NULL (Global)
        if (filtroActual !== 'todos') {
            query = query.or(`user_id.eq.${filtroActual},user_id.is.null`);
        }

        const { data: eventos, error } = await query;
        if (error) return console.error("Error eventos:", error);

        eventos?.forEach(event => {
            const start = new Date(event.fecha_inicio);
            const end = new Date(event.fecha_fin);
            
            // Normalizar horas para evitar saltos de día por zona horaria
            start.setHours(0,0,0,0);
            end.setHours(23,59,59,999);

            let d = new Date(start);
            while (d <= end) {
                if (d.getMonth() === month && d.getFullYear() === year) {
                    const cell = dayCellMap.get(d.getDate());
                    if (cell) {
                        const div = document.createElement('div');
                        div.className = 'calendar-event';
                        div.style.backgroundColor = event.color || '#6f42c1';
                        
                        // Iconos informativos según asignación
                        let tag = event.user_id ? "👤 " : (event.rol_id ? "👥 " : "🌐 ");
                        div.textContent = tag + event.titulo;
                        div.title = event.descripcion || '';
                        
                        cell.appendChild(div);
                    }
                }
                d.setDate(d.getDate() + 1);
            }
        });
    }

    // =============================
    // 4. GUARDAR PROYECTO
    // =============================
    async function guardarProyecto(e) {
        e.preventDefault();

        const nuevoEvento = {
            titulo: inputTituloProy.value,
            descripcion: inputDescProy.value,
            fecha_inicio: inputStartProy.value,
            fecha_fin: inputEndProy.value,
            color: inputColorProy.value,
            empresa_id: userProfile.empresa_id,
            creado_por: userProfile.id,
            rol_id: selectRolProy.value || null,
            user_id: selectEmpleadoProy.value || null
        };

        const { error } = await supabase
            .from('eventos_calendario')
            .insert([nuevoEvento]);

        if (error) {
            alert("Error al guardar: " + error.message);
        } else {
            alert("¡Proyecto/Evento publicado!");
            cerrarModal();
            renderCalendar();
        }
    }

    // =============================
    // 5. RENDERIZADO DEL GRID
    // =============================
    function renderCalendar() {
        const dayCellMap = updateCalendarGrid(currentMonth, currentYear);
        markEventos(currentMonth, currentYear, dayCellMap);
    }

    function updateCalendarGrid(month, year) {
        const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        monthYearDisplay.textContent = `${monthNames[month]} ${year}`;
        
        // Limpiar celdas anteriores preservando headers
        calendarGridBody.querySelectorAll('.day-cell').forEach(c => c.remove());

        let firstDay = new Date(year, month, 1).getDay();
        firstDay = firstDay === 0 ? 7 : firstDay; 
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dayCellMap = new Map();

        // Rellenar huecos mes anterior
        for (let i = 1; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'day-cell other-month';
            calendarGridBody.appendChild(empty);
        }

        // Crear días del mes
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'day-cell';
            const num = document.createElement('div');
            num.className = 'day-number';
            num.textContent = day;
            cell.appendChild(num);

            if (day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
                cell.classList.add('today');
            }

            calendarGridBody.appendChild(cell);
            dayCellMap.set(day, cell);
        }
        return dayCellMap;
    }

    // =============================
    // 6. EVENTOS DE UI
    // =============================
    selectEmpleadoFiltro?.addEventListener('change', (e) => {
        filtroActual = e.target.value;
        renderCalendar();
    });

    prevButton.onclick = () => { 
        currentMonth--; 
        if(currentMonth < 0){currentMonth=11; currentYear--;} 
        renderCalendar(); 
    };

    nextButton.onclick = () => { 
        currentMonth++; 
        if(currentMonth > 11){currentMonth=0; currentYear++;} 
        renderCalendar(); 
    };

    const abrirModal = () => modalProyecto?.classList.remove('modal-hidden');
    const cerrarModal = () => {
        modalProyecto?.classList.add('modal-hidden');
        formProyecto.reset();
    };

    btnNuevoProyecto?.addEventListener('click', abrirModal);
    btnCerrarModalProy?.addEventListener('click', cerrarModal);
    formProyecto?.addEventListener('submit', guardarProyecto);

    document.getElementById('btn-logout')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '../login/login.html';
    });
    
    init();
});
