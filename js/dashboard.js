import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    // ELEMENTOS DEL DOM EXISTENTES
    const startButton    = document.getElementById('btn-clock-in');
    const pauseButton    = document.getElementById('btn-pause');
    const endButton      = document.getElementById('btn-end');
    const statusBadge    = document.getElementById('clock-status-badge');
    const summaryHoy     = document.getElementById('summary-horas-hoy');
    const userNameHeader = document.getElementById('user-name-header');
    const btnLogout      = document.getElementById('btn-logout');

    // NUEVOS ELEMENTOS PARA DINAMIZAR EL DASHBOARD
    const contenedorTareas = document.getElementById('contenedor-tareas-dashboard');
    const proximoEvento    = document.getElementById('proximo-evento-texto');
    const resumenVacaciones = document.getElementById('resumen-vacaciones');

    let activeJornada = null;
    let userProfile   = null;
    let uiInterval    = null;

    // ==========================================
    // 1. CARGA DE USUARIO E INICIALIZACIÓN
    // ==========================================
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        window.location.href = '../login/login.html';
        return;
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, nombre, empresa_id, rol_id')
        .eq('id', session.user.id)
        .single();

    if (profile) {
        userProfile = profile;
        if (userNameHeader) userNameHeader.textContent = profile.nombre;
        
        // Ejecutamos todas las cargas de datos
        cargarEstadoActual();
        cargarTareasDashboard();
        cargarProximoEvento();
        cargarVacacionesDashboard();
    }

    // ==========================================
    // 2. TAREAS PENDIENTES (KANBAN)
    // ==========================================
    async function cargarTareasDashboard() {
        if (!contenedorTareas) return;

        // Buscamos tareas en estado 'todo' de este usuario
        const { data: tareas } = await supabase
            .from('tareas')
            .select('*')
            .eq('creado_por', userProfile.id)
            .eq('estado', 'todo')
            .limit(3); 

        if (!tareas || tareas.length === 0) {
            contenedorTareas.innerHTML = '<p style="color:gray; font-size:0.9rem;">No hay tareas pendientes.</p>';
            return;
        }

        contenedorTareas.innerHTML = tareas.map(t => `
            <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; margin-bottom: 8px; border-left: 4px solid var(--primary-color);">
                <p style="margin:0; font-size:0.9rem;"><strong>${t.titulo}</strong></p>
                <small style="color:gray;">Prioridad: ${t.prioridad}</small>
            </div>
        `).join('');
    }

    // ==========================================
    // 3. PRÓXIMO EVENTO (CALENDARIO)
    // ==========================================
    async function cargarProximoEvento() {
        if (!proximoEvento) return;

        const ahora = new Date().toISOString();

        // Traer el evento más cercano que aún no haya pasado
        const { data: evento } = await supabase
            .from('eventos_calendario')
            .select('*')
            .eq('empresa_id', userProfile.empresa_id)
            .gte('fecha_inicio', ahora)
            .order('fecha_inicio', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (evento) {
            const fecha = new Date(evento.fecha_inicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            proximoEvento.innerHTML = `<span style="color:var(--primary-color)">${fecha}:</span> ${evento.titulo}`;
        } else {
            proximoEvento.textContent = "Sin eventos próximos";
        }
    }

    // ==========================================
    // 4. VACACIONES (CÁLCULO DE DÍAS)
    // ==========================================
    async function cargarVacacionesDashboard() {
        if (!resumenVacaciones) return;

        const { data: vacaciones } = await supabase
            .from('solicitudes')
            .select('*')
            .eq('user_id', userProfile.id)
            .eq('estado', 'Aprobada');

        let diasUsados = 0;
        vacaciones?.forEach(v => {
            const inicio = new Date(v.fecha_inicio);
            const fin = new Date(v.fecha_fin);
            const diff = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
            diasUsados += diff;
        });

        const diasTotales = 30; 
        const restantes = diasTotales - diasUsados;

        resumenVacaciones.innerHTML = `
            <div style="text-align:center;">
                <h2 style="margin:0; color:var(--primary-color); font-size:2rem;">${restantes}</h2>
                <p style="margin:0; font-size:0.8rem; color:gray;">días restantes</p>
            </div>
        `;
    }

    // ==========================================
    // 5. CONTROL DE JORNADA (LÓGICA EXISTENTE)
    // ==========================================
    async function cargarEstadoActual() {
        const { data: jornada } = await supabase
            .from('jornadas')
            .select('*')
            .eq('usuario_id', session.user.id)
            .is('hora_salida', null)
            .order('hora_entrada', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (jornada) {
            activeJornada = jornada;
            actualizarInterfaz(jornada.estado === 'pausa' ? 'pause' : 'in');
            iniciarContador();
        } else {
            actualizarInterfaz('out');
        }
    }

    startButton.onclick = async () => {
        const ahora = new Date().toISOString();
        if (!activeJornada) {
            const { data, error } = await supabase.from('jornadas').insert([{
                usuario_id: userProfile.id,
                empresa_id: userProfile.empresa_id,
                rol_id: userProfile.rol_id,
                hora_entrada: ahora,
                estado: 'activo'
            }]).select().single();
            if (!error) activeJornada = data;
        } else {
            await supabase.from('jornadas').update({ estado: 'activo' }).eq('id', activeJornada.id);
            activeJornada.estado = 'activo';
        }
        cargarEstadoActual();
    };

    pauseButton.onclick = async () => {
        if (!activeJornada) return;
        await supabase.from('jornadas').update({ estado: 'pausa' }).eq('id', activeJornada.id);
        cargarEstadoActual();
    };

    endButton.onclick = async () => {
        if (!activeJornada) return;
        if (!confirm("¿Finalizar jornada laboral?")) return;
        const ahora = new Date().toISOString();
        await supabase.from('jornadas').update({ hora_salida: ahora, estado: 'completado' }).eq('id', activeJornada.id);
        activeJornada = null;
        pararContador();
        cargarEstadoActual();
    };

    btnLogout.onclick = async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '../login/login.html';
    };

    // HELPERS
    function actualizarInterfaz(estado) {
        statusBadge.className = 'status-badge'; 
        if (estado === 'in') {
            statusBadge.textContent = 'En progreso';
            statusBadge.classList.add('status-in');
            startButton.disabled = true; pauseButton.disabled = false; endButton.disabled = false;
        } else if (estado === 'pause') {
            statusBadge.textContent = 'Descanso';
            statusBadge.classList.add('status-pause');
            startButton.disabled = false; pauseButton.disabled = true; endButton.disabled = false;
        } else {
            statusBadge.textContent = 'Fuera';
            statusBadge.classList.add('status-out');
            startButton.disabled = false; pauseButton.disabled = true; endButton.disabled = true;
        }
    }

    function iniciarContador() {
        if (uiInterval) clearInterval(uiInterval);
        uiInterval = setInterval(() => {
            if (!activeJornada || activeJornada.estado === 'pausa') return;
            const diff = Math.floor((new Date() - new Date(activeJornada.hora_entrada)) / 1000);
            summaryHoy.textContent = formatTime(diff);
        }, 1000);
    }

    function pararContador() {
        if (uiInterval) clearInterval(uiInterval);
        summaryHoy.textContent = "0h 00m 00s";
    }

    function formatTime(s) {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const seg = s % 60;
        return `${h}h ${String(m).padStart(2,'0')}m ${String(seg).padStart(2,'0')}s`;
    }
});