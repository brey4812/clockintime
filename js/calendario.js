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

    let currentDate  = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear  = currentDate.getFullYear();
    let userProfile  = null;

    const eventColors = {
        'Pendiente': '#f5a623',
        'Aprobada':  '#28a745',
        'Proyecto':  '#6f42c1',
        'Festivo':   '#e74c3c',
        'default':   '#4a90e2'
    };

    // =============================
    // 1. INICIO: SESIÓN Y PERFIL
    // =============================
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = '../login/login.html'; return; }

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, nombre, empresa_id, rol_id')
        .eq('id', session.user.id)
        .single();

    if (profile) {
        userProfile = profile;
        if (userNameHeader) userNameHeader.textContent = profile.nombre;
        renderCalendar();
    }

    // =============================
    // 2. CONSTRUIR EL GRID
    // =============================
    function updateCalendar(month, year) {
        const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        if (monthYearDisplay) monthYearDisplay.textContent = `${monthNames[month]} ${year}`;

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

            if (day === currentDate.getDate() && month === currentDate.getMonth() && year === currentDate.getFullYear()) {
                cell.classList.add('today');
            }

            calendarGridBody.appendChild(cell);
            dayCellMap.set(day, cell);
        }
        return dayCellMap;
    }

    // =============================
    // 3. CARGAR EVENTOS DE SUPABASE
    // =============================
    async function markEventos(month, year, dayCellMap) {
        if (!userProfile) return;

        // A. Cargar tus solicitudes (Vacaciones, etc.)
        const { data: solicitudes } = await supabase
            .from('solicitudes')
            .select('*')
            .eq('user_id', userProfile.id)
            .neq('estado', 'Rechazada');

        // B. Cargar eventos de la empresa (Globales o de tu Rol)
        const { data: eventosEmpresa } = await supabase
            .from('eventos_calendario')
            .select('*')
            .eq('empresa_id', userProfile.empresa_id)
            .or(`rol_id.eq.${userProfile.rol_id},rol_id.is.null`);

        const allItems = [
            ...(solicitudes || []).map(s => ({ 
                titulo: s.tipo, 
                inicio: s.fecha_inicio, 
                fin: s.fecha_fin, 
                color: eventColors[s.estado] || eventColors['default'] 
            })),
            ...(eventosEmpresa || []).map(e => ({ 
                titulo: e.titulo, 
                inicio: e.fecha_inicio, 
                fin: e.fecha_fin, 
                color: e.color || eventColors['Proyecto'] 
            }))
        ];

        allItems.forEach(item => {
            const start = new Date(item.inicio);
            const end = new Date(item.fin);
            let d = new Date(start);

            while (d <= end) {
                if (d.getMonth() === month && d.getFullYear() === year) {
                    const cell = dayCellMap.get(d.getDate());
                    if (cell) {
                        const div = document.createElement('div');
                        div.className = 'calendar-event';
                        div.textContent = item.titulo;
                        div.style.backgroundColor = item.color;
                        div.style.color = '#fff';
                        div.style.fontSize = '0.65rem';
                        div.style.padding = '2px 4px';
                        div.style.borderRadius = '3px';
                        div.style.marginBottom = '2px';
                        div.style.whiteSpace = 'nowrap';
                        div.style.overflow = 'hidden';
                        div.style.textOverflow = 'ellipsis';
                        cell.appendChild(div);
                    }
                }
                d.setDate(d.getDate() + 1);
            }
        });
    }

    function renderCalendar() {
        const dayCellMap = updateCalendar(currentMonth, currentYear);
        markEventos(currentMonth, currentYear, dayCellMap);
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
});
