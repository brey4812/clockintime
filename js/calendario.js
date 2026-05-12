import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {

    // =============================
    // ELEMENTOS DEL DOM
    // =============================
    const prevButton       = document.getElementById('btn-cal-prev');
    const nextButton       = document.getElementById('btn-cal-next');
    const monthYearDisplay = document.getElementById('calendar-month-year');
    const calendarGridBody = document.getElementById('calendar-grid-body');
    const userNameHeader   = document.getElementById('user-name-header');
    
    // Botones de filtro (Asegúrate de que tengan estos IDs en tu HTML)
    const btnGlobal        = document.getElementById('view-global');
    const btnPersonal      = document.getElementById('view-personal');

    let currentMonth = new Date().getMonth();
    let currentYear  = new Date().getFullYear();
    let userProfile  = null;
    let allEvents    = []; // Almacén de datos para filtrar sin recargar
    let currentView  = 'global'; // 'global' o 'personal'

    // Colores configurados
    const eventColors = {
        'Pendiente': '#f5a623', // Naranja
        'Aprobada':  '#28a745', // Verde
        'Empresa':   '#4a90e2', // Azul
        'Proyecto':  '#6f42c1', // Morado
        'Festivo':   '#e74c3c'  // Rojo
    };

    // =============================
    // 1. CARGA INICIAL DE DATOS
    // =============================
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = '../login/login.html';
        return;
    }

    // Obtener perfil del usuario
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, nombre, empresa_id, rol_id')
        .eq('id', session.user.id)
        .single();

    if (profile) {
        userProfile = profile;
        if (userNameHeader) userNameHeader.textContent = profile.nombre;
        
        // Traemos todos los datos de Supabase una sola vez
        await fetchAllCalendarData();
        renderCalendar();
    }

    async function fetchAllCalendarData() {
        // A. Tus solicitudes (Vacaciones, Bajas, etc.)
        const { data: solicitudes } = await supabase
            .from('solicitudes')
            .select('*')
            .eq('user_id', userProfile.id)
            .neq('estado', 'Rechazada');

        // B. Eventos de la empresa
        const { data: eventosEmpresa } = await supabase
            .from('eventos_calendario')
            .select('*')
            .eq('empresa_id', userProfile.empresa_id);

        // Combinamos y clasificamos por tipo
        allEvents = [
            ...(solicitudes || []).map(s => ({
                titulo: s.tipo,
                inicio: s.fecha_inicio,
                fin: s.fecha_fin,
                categoria: 'personal', // Es tuyo
                color: s.estado === 'Aprobada' ? eventColors['Aprobada'] : eventColors['Pendiente']
            })),
            ...(eventosEmpresa || []).map(e => ({
                titulo: e.titulo,
                inicio: e.fecha_inicio,
                fin: e.fecha_fin,
                // Si el evento es para tu rol o es global (null), es personal. Si es para otro rol, es global.
                categoria: (e.rol_id === userProfile.rol_id || !e.rol_id) ? 'personal' : 'global',
                color: e.color || eventColors['Empresa']
            }))
        ];
    }

    // =============================
    // 2. LÓGICA DE RENDERIZADO
    // =============================
    function renderCalendar() {
        const dayCellMap = updateCalendarGrid(currentMonth, currentYear);
        
        // Filtramos los eventos según la vista seleccionada
        const filteredEvents = allEvents.filter(event => {
            if (currentView === 'personal') {
                return event.categoria === 'personal';
            }
            return true; // En vista global se ve todo
        });

        drawEvents(filteredEvents, dayCellMap);
    }

    function updateCalendarGrid(month, year) {
        const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        if (monthYearDisplay) monthYearDisplay.textContent = `${monthNames[month]} ${year}`;

        calendarGridBody.querySelectorAll('.day-cell').forEach(c => c.remove());

        let firstDay = new Date(year, month, 1).getDay();
        firstDay = firstDay === 0 ? 7 : firstDay; 
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dayCellMap = new Map();

        // Días del mes anterior (vacíos)
        for (let i = 1; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'day-cell other-month';
            calendarGridBody.appendChild(empty);
        }

        // Días actuales
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

    function drawEvents(events, dayCellMap) {
        events.forEach(item => {
            const start = new Date(item.inicio);
            const end = new Date(item.fin);
            let d = new Date(start);

            while (d <= end) {
                if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                    const cell = dayCellMap.get(d.getDate());
                    if (cell) {
                        const div = document.createElement('div');
                        div.className = 'calendar-event';
                        div.textContent = item.titulo;
                        div.style.backgroundColor = item.color;
                        div.title = item.titulo; // Tooltip con el nombre completo
                        cell.appendChild(div);
                    }
                }
                d.setDate(d.getDate() + 1);
            }
        });
    }

    // =============================
    // 3. INTERACCIÓN Y NAVEGACIÓN
    // =============================
    
    // Cambiar a Vista Global
    btnGlobal?.addEventListener('click', () => {
        currentView = 'global';
        btnGlobal.classList.add('active');
        btnPersonal.classList.remove('active');
        renderCalendar();
    });

    // Cambiar a Vista Personal
    btnPersonal?.addEventListener('click', () => {
        currentView = 'personal';
        btnPersonal.classList.add('active');
        btnGlobal.classList.remove('active');
        renderCalendar();
    });

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

    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '../login/login.html';
    });
});
