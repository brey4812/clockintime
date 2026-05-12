import { supabase } from './supabase-client.js';

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
const btnLogout    = document.getElementById('btn-logout');

// ==========================
// ESTADO DE LA JORNADA
// ==========================
let workDay = {
    date: null,
    startTime: null,
    endTime: null,
    startTimestamp: null,
    pausedAt: null,
    pausedTime: 0,
    totalSeconds: 0,
    email: null
};

let uiInterval = null;

// ==========================
// CARGAR DATOS DE USUARIO Y LOGOUT
// ==========================
async function cargarDatosUsuario() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
        window.location.href = '../login/login.html';
        return;
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('nombre, email')
        .eq('id', session.user.id)
        .single();

    if (profile && userNameHeader) {
        userNameHeader.textContent = profile.nombre;
        workDay.email = profile.email;
    }
}

// LOGIC PARA CERRAR SESIÓN
btnLogout?.addEventListener('click', async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Error al cerrar sesión:", error.message);
    } else {
        // Limpiamos rastro local de jornada si se desea, o lo dejamos para que siga al volver
        window.location.href = '../login/login.html';
    }
});

// ==========================
// FUNCIONES DE JORNADA (LÓGICA LOCALSTORAGE)
// ==========================
function startWorkDay() {
    const now = new Date();
    if (!workDay.startTimestamp) {
        workDay.date           = now.toISOString();
        workDay.startTime      = now.toLocaleTimeString();
        workDay.startTimestamp = Date.now();
    }
    if (workDay.pausedAt) {
        workDay.pausedTime += Date.now() - workDay.pausedAt;
        workDay.pausedAt = null;
    }
    startUIUpdater();
    saveCurrentWorkDay();
    updateUIStatus('in');
}

function pauseWorkDay() {
    if (!workDay.pausedAt) {
        workDay.pausedAt = Date.now();
    }
    stopUIUpdater();
    saveCurrentWorkDay();
    updateUIStatus('pause');
}

function endWorkDay() {
    if (!confirm("¿Estás seguro de que quieres finalizar la jornada?")) return;
    stopUIUpdater();
    workDay.endTime = new Date().toLocaleTimeString();
    updateTotalSeconds();
    saveWorkDay(workDay);
    localStorage.removeItem('currentWorkDay');
    resetWorkDay();
    loadWeekWorkDays();
    updateUIStatus('out');
    if (summaryHoy) summaryHoy.textContent = '0h 00m 00s';
}

// ==========================
// HELPERS UI Y TIEMPO
// ==========================
function updateUIStatus(status) {
    if (!statusBadge) return;
    statusBadge.classList.remove('status-in', 'status-out', 'status-pause');
    
    if (status === 'in') {
        statusBadge.textContent = 'En progreso';
        statusBadge.classList.add('status-in');
        startButton.disabled = true;
        pauseButton.disabled = false;
        endButton.disabled = false;
    } else if (status === 'pause') {
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

function startUIUpdater() {
    if (uiInterval) return;
    uiInterval = setInterval(() => {
        updateTotalSeconds();
        if (summaryHoy) summaryHoy.textContent = formatTime(workDay.totalSeconds);
    }, 1000);
}

function stopUIUpdater() {
    clearInterval(uiInterval);
    uiInterval = null;
}

function updateTotalSeconds() {
    if (!workDay.startTimestamp) return;
    const now = Date.now();
    const paused = workDay.pausedAt ? (now - workDay.pausedAt) : 0;
    const elapsed = now - workDay.startTimestamp - workDay.pausedTime - paused;
    workDay.totalSeconds = Math.max(0, Math.floor(elapsed / 1000));
    saveCurrentWorkDay();
}

function saveCurrentWorkDay() { localStorage.setItem('currentWorkDay', JSON.stringify(workDay)); }
function saveWorkDay(day) {
    const history = JSON.parse(localStorage.getItem('workDays')) || [];
    history.push(day);
    localStorage.setItem('workDays', JSON.stringify(history));
}

function loadWeekWorkDays() {
    const history = JSON.parse(localStorage.getItem('workDays')) || [];
    let totalSeconds = 0;
    // Lógica simple de suma (puedes filtrar por fecha si quieres)
    history.forEach(day => totalSeconds += (day.totalSeconds || 0));
    if (summaryWeek) summaryWeek.textContent = formatTime(totalSeconds);
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
}

function resetWorkDay() {
    workDay = { date: null, startTime: null, endTime: null, startTimestamp: null, pausedAt: null, pausedTime: 0, totalSeconds: 0, email: workDay.email };
}

function loadCurrentWorkDay() {
    const saved = localStorage.getItem('currentWorkDay');
    if (!saved) {
        updateUIStatus('out');
        return;
    }
    workDay = JSON.parse(saved);
    if (!workDay.endTime && !workDay.pausedAt) {
        startUIUpdater();
        updateUIStatus('in');
    } else if (workDay.pausedAt) {
        updateUIStatus('pause');
    }
    if (summaryHoy) summaryHoy.textContent = formatTime(workDay.totalSeconds);
}

// ==========================
// EVENTOS Y ARRANQUE
// ==========================
startButton?.addEventListener('click', startWorkDay);
pauseButton?.addEventListener('click', pauseWorkDay);
endButton?.addEventListener('click', endWorkDay);

async function run() {
    await cargarDatosUsuario();
    loadCurrentWorkDay();
    loadWeekWorkDays();
}

run();
