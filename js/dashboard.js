import { supabase } from '../js/supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {

    // ==========================
    // ELEMENTOS DEL DOM
    // ==========================
    const startButton  = document.getElementById('btn-clock-in');
    const pauseButton  = document.getElementById('btn-pause');
    const endButton    = document.getElementById('btn-end');
    const statusBadge  = document.getElementById('clock-status-badge');
    const summaryHoy   = document.getElementById('summary-horas-hoy');
    const summaryWeek  = document.getElementById('summary-horas-semana');
    const userNameHeader = document.getElementById('user-name-header');

    // ==========================
    // ESTADO LOCAL
    // ==========================
    let activeJornada = null; // Guardará el registro actual de la DB
    let userProfile = null;
    let uiInterval = null;

    // ==========================
    // INIT: VERIFICAR SESIÓN Y CARGAR ESTADO
    // ==========================
    async function init() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return window.location.href = '../login/login.html';

        // Cargar perfil con Empresa y Rol
        const { data: profile } = await supabase
            .from('profiles')
            .select('*, roles(nombre_rol)')
            .eq('id', session.user.id)
            .single();

        userProfile = profile;
        if (userNameHeader) userNameHeader.textContent = profile.nombre;

        await verificarJornadaActiva();
        await cargarHorasSemanales();
    }

    // ==========================
    // VERIFICAR SI HAY JORNADA ABIERTA
    // ==========================
    async function verificarJornadaActiva() {
        const { data: jornada, error } = await supabase
            .from('jornadas')
            .select('*')
            .eq('usuario_id', userProfile.id)
            .is('hora_salida', null) // Si no tiene salida, está activa
            .single();

        if (jornada) {
            activeJornada = jornada;
            setUIStatus(jornada.estado === 'pausa' ? 'pause' : 'in');
            startUIUpdater();
        } else {
            setUIStatus('out');
        }
    }

    // ==========================
    // FUNCIONES DE FICHAJE (ENTRADA / PAUSA / FIN)
    // ==========================
    
    async function startWorkDay() {
        const ahora = new Date().toISOString();

        if (!activeJornada) {
            // NUEVO FICHAJE
            const { data, error } = await supabase
                .from('jornadas')
                .insert([{
                    usuario_id: userProfile.id,
                    empresa_id: userProfile.empresa_id,
                    rol_id: userProfile.rol_id,
                    hora_entrada: ahora,
                    estado: 'activo'
                }])
                .select()
                .single();

            if (error) return alert("Error al iniciar jornada");
            activeJornada = data;
        } else if (activeJornada.estado === 'pausa') {
            // VOLVER DE PAUSA
            const { error } = await supabase
                .from('jornadas')
                .update({ estado: 'activo' })
                .eq('id', activeJornada.id);
            
            if (error) return;
            activeJornada.estado = 'activo';
        }

        setUIStatus('in');
        startUIUpdater();
    }

    async function pauseWorkDay() {
        if (!activeJornada) return;

        const { error } = await supabase
            .from('jornadas')
            .update({ estado: 'pausa' })
            .eq('id', activeJornada.id);

        if (error) return;
        
        activeJornada.estado = 'pausa';
        setUIStatus('pause');
        stopUIUpdater();
    }

    async function endWorkDay() {
        if (!activeJornada) return;

        const ahora = new Date().toISOString();
        
        const { error } = await supabase
            .from('jornadas')
            .update({ 
                hora_salida: ahora,
                estado: 'completado'
            })
            .eq('id', activeJornada.id);

        if (error) return alert("Error al cerrar jornada");

        stopUIUpdater();
        activeJornada = null;
        setUIStatus('out');
        if (summaryHoy) summaryHoy.textContent = '0h 00m 00s';
        await cargarHorasSemanales();
    }

    // ==========================
    // UI Y ACTUALIZACIÓN
    // ==========================
    
    function setUIStatus(status) {
        // Reset
        statusBadge.classList.remove('status-in', 'status-out', 'status-pause');
        startButton.disabled = false;
        pauseButton.disabled = true;
        endButton.disabled = true;

        if (status === 'in') {
            statusBadge.textContent = 'En progreso';
            statusBadge.classList.add('status-in');
            startButton.disabled = true;
            pauseButton.disabled = false;
            endButton.disabled = false;
        } else if (status === 'pause') {
            statusBadge.textContent = 'En descanso';
            statusBadge.classList.add('status-pause');
            pauseButton.disabled = true; // No se puede pausar si ya está pausado
            endButton.disabled = false;
        } else {
            statusBadge.textContent = 'Fuera del trabajo';
            statusBadge.classList.add('status-out');
            pauseButton.disabled = true;
            endButton.disabled = true;
        }
    }

    function startUIUpdater() {
        if (uiInterval) clearInterval(uiInterval);
        uiInterval = setInterval(updateUIHours, 1000);
    }

    function stopUIUpdater() {
        clearInterval(uiInterval);
        uiInterval = null;
    }

    function updateUIHours() {
        if (!activeJornada || activeJornada.estado === 'pausa') return;

        const entrada = new Date(activeJornada.hora_entrada);
        const ahora = new Date();
        const diffSegundos = Math.floor((ahora - entrada) / 1000);
        
        if (summaryHoy) summaryHoy.textContent = formatTime(diffSegundos);
    }

    // ==========================
    // CÁLCULOS SEMANALES (HISTÓRICO)
    // ==========================
    async function cargarHorasSemanales() {
        // Obtenemos el lunes de esta semana
        const hoy = new Date();
        const lunes = new Date(hoy.setDate(hoy.getDate() - hoy.getDay() + 1)).toISOString().split('T')[0];

        const { data: jornadas, error } = await supabase
            .from('jornadas')
            .select('hora_entrada, hora_salida')
            .eq('usuario_id', userProfile.id)
            .gte('fecha', lunes);

        if (error) return;

        let totalSegundos = 0;
        jornadas.forEach(j => {
            if (j.hora_entrada && j.hora_salida) {
                const diff = (new Date(j.hora_salida) - new Date(j.hora_entrada)) / 1000;
                totalSegundos += diff;
            }
        });

        if (summaryWeek) summaryWeek.textContent = formatTime(Math.floor(totalSegundos));
    }

    // ==========================
    // UTILIDADES
    // ==========================
    function formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
    }

    // Eventos
    startButton.addEventListener('click', startWorkDay);
    pauseButton.addEventListener('click', pauseWorkDay);
    endButton.addEventListener('click', endWorkDay);

    init();
});
