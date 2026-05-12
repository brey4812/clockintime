import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    // ELEMENTOS DEL DOM
    const startButton    = document.getElementById('btn-clock-in');
    const pauseButton    = document.getElementById('btn-pause');
    const endButton      = document.getElementById('btn-end');
    const statusBadge    = document.getElementById('clock-status-badge');
    const summaryHoy     = document.getElementById('summary-horas-hoy');
    const summaryWeek    = document.getElementById('summary-horas-semana');
    const userNameHeader = document.getElementById('user-name-header');
    const btnLogout      = document.getElementById('btn-logout');

    let activeJornada = null;
    let userProfile   = null;
    let uiInterval    = null;

    // ==========================================
    // 1. CARGA DE USUARIO Y NOMBRE REAL
    // ==========================================
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        window.location.href = '../login/login.html';
        return;
    }

    // Traemos el perfil para tener el nombre y los IDs necesarios para la tabla
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, nombre, empresa_id, rol_id')
        .eq('id', session.user.id)
        .single();

    if (profile) {
        userProfile = profile;
        if (userNameHeader) userNameHeader.textContent = profile.nombre;
    }

    // ==========================================
    // 2. VERIFICAR ESTADO (PARA QUE NO SE PIERDA AL RECARGAR)
    // ==========================================
    async function cargarEstadoActual() {
        const { data: jornada } = await supabase
            .from('jornadas')
            .select('*')
            .eq('usuario_id', session.user.id)
            .is('hora_salida', null) // Buscamos la que no ha terminado
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

    // ==========================================
    // 3. ACCIONES DE LOS BOTONES (FUNCIONALIDAD REAL)
    // ==========================================

    startButton.onclick = async () => {
        const ahora = new Date().toISOString();

        if (!activeJornada) {
            // INSERTAR EN LA TABLA (Aseguramos que coincidan los campos)
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

            if (error) {
                console.error("Error al insertar:", error);
                alert("No se pudo guardar en la base de datos.");
                return;
            }
            activeJornada = data;
        } else {
            // SI ESTABA EN PAUSA, VOLVEMOS A ACTIVO
            await supabase.from('jornadas')
                .update({ estado: 'activo' })
                .eq('id', activeJornada.id);
            activeJornada.estado = 'activo';
        }
        cargarEstadoActual();
    };

    pauseButton.onclick = async () => {
        if (!activeJornada) return;
        await supabase.from('jornadas')
            .update({ estado: 'pausa' })
            .eq('id', activeJornada.id);
        cargarEstadoActual();
    };

    endButton.onclick = async () => {
        if (!activeJornada) return;
        if (!confirm("¿Finalizar jornada laboral?")) return;

        const ahora = new Date().toISOString();
        const { error } = await supabase.from('jornadas')
            .update({ 
                hora_salida: ahora, 
                estado: 'completado' 
            })
            .eq('id', activeJornada.id);

        if (error) {
            alert("Error al finalizar: " + error.message);
        } else {
            activeJornada = null;
            pararContador();
            cargarEstadoActual();
        }
    };

    btnLogout.onclick = async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '../login/login.html';
    };

    // ==========================================
    // HELPERS DE INTERFAZ
    // ==========================================
    function actualizarInterfaz(estado) {
        statusBadge.className = 'status-badge'; 
        if (estado === 'in') {
            statusBadge.textContent = 'En progreso';
            statusBadge.classList.add('status-in');
            startButton.disabled = true;
            pauseButton.disabled = false;
            endButton.disabled = false;
        } else if (estado === 'pause') {
            statusBadge.textContent = 'Descanso';
            statusBadge.classList.add('status-pause');
            startButton.disabled = false;
            pauseButton.disabled = true;
            endButton.disabled = false;
        } else {
            statusBadge.textContent = 'Fuera del trabajo';
            statusBadge.classList.add('status-out');
            startButton.disabled = false;
            pauseButton.disabled = true;
            endButton.disabled = true;
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

    cargarEstadoActual();
});
