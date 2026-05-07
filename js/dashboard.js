// ==========================
// ELEMENTOS DEL DOM
// ==========================
const startButton  = document.getElementById('btn-clock-in');
const pauseButton  = document.getElementById('btn-pause');
const endButton    = document.getElementById('btn-end');
const statusBadge  = document.getElementById('clock-status-badge');
const summaryHoy   = document.getElementById('summary-horas-hoy');
const summaryWeek  = document.getElementById('summary-horas-semana');

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
    email: null   // guardamos el email para identificar jornadas por empleado
};

let uiInterval = null;

// ==========================
// ESTADO INICIAL
// ==========================
pauseButton.disabled = true;
endButton.disabled   = true;

// ==========================
// EVENTOS
// ==========================
startButton.addEventListener('click', startWorkDay);
pauseButton.addEventListener('click', pauseWorkDay);
endButton.addEventListener('click',   endWorkDay);

// ==========================
// FUNCIONES PRINCIPALES
// ==========================
function startWorkDay() {

    const now = new Date();

    if (!workDay.startTimestamp) {
        workDay.date           = now.toISOString();
        workDay.startTime      = now.toLocaleTimeString();
        workDay.startTimestamp = Date.now();
        workDay.email          = localStorage.getItem('currentUserEmail') || null;
    }

    // Si venía de pausa, acumulamos el tiempo pausado
    if (workDay.pausedAt) {
        workDay.pausedTime += Date.now() - workDay.pausedAt;
        workDay.pausedAt = null;
    }

    startUIUpdater();
    saveCurrentWorkDay();

    statusBadge.textContent = 'En progreso';
    statusBadge.classList.remove('status-out', 'status-pause');
    statusBadge.classList.add('status-in');

    pauseButton.disabled = false;
    endButton.disabled   = false;
}

function pauseWorkDay() {

    if (!workDay.pausedAt) {
        workDay.pausedAt = Date.now();
    }

    stopUIUpdater();
    saveCurrentWorkDay();

    statusBadge.textContent = 'Descanso';
    statusBadge.classList.remove('status-in');
    statusBadge.classList.add('status-pause');
}

function endWorkDay() {

    stopUIUpdater();

    workDay.endTime = new Date().toLocaleTimeString();
    updateTotalSeconds();

    saveWorkDay(workDay);
    localStorage.removeItem('currentWorkDay');

    resetWorkDay();
    loadWeekWorkDays();

    statusBadge.textContent = 'Fuera del trabajo';
    statusBadge.classList.remove('status-in', 'status-pause');
    statusBadge.classList.add('status-out');

    pauseButton.disabled = true;
    endButton.disabled   = true;

    if (summaryHoy) summaryHoy.textContent = '0h 00m 00s';
}

// ==========================
// UI UPDATER
// ==========================
function startUIUpdater() {
    if (uiInterval) return;
    uiInterval = setInterval(() => {
        updateTotalSeconds();
        updateDailyHours();
    }, 1000);
}

function stopUIUpdater() {
    clearInterval(uiInterval);
    uiInterval = null;
}

// ==========================
// CÁLCULO REAL DE TIEMPO
// ==========================
function updateTotalSeconds() {

    if (!workDay.startTimestamp) return;

    const now    = Date.now();
    const paused = workDay.pausedAt ? (now - workDay.pausedAt) : 0;
    const elapsed = now - workDay.startTimestamp - workDay.pausedTime - paused;

    workDay.totalSeconds = Math.max(0, Math.floor(elapsed / 1000));
    saveCurrentWorkDay();
}

// ==========================
// STORAGE
// ==========================
function saveCurrentWorkDay() {
    localStorage.setItem('currentWorkDay', JSON.stringify(workDay));
}

function saveWorkDay(day) {
    const history = JSON.parse(localStorage.getItem('workDays')) || [];
    history.push(day);
    localStorage.setItem('workDays', JSON.stringify(history));
}

// ==========================
// ACTUALIZAR UI
// ==========================
function updateDailyHours() {
    if (summaryHoy) summaryHoy.textContent = formatTime(workDay.totalSeconds);
}

// ==========================
// CÁLCULO SEMANAL
// ==========================
function loadWeekWorkDays() {

    const history     = JSON.parse(localStorage.getItem('workDays')) || [];
    const currentWeek = getCurrentWeekDays();
    let totalSeconds  = 0;

    history.forEach(day => {
        if (!day.date) return;
        const dayDate = new Date(day.date);
        if (currentWeek.includes(dayDate.toDateString())) {
            totalSeconds += (day.totalSeconds || 0);
        }
    });

    // Fijamos solo el valor, no un texto descriptivo completo
    if (summaryWeek) summaryWeek.textContent = formatTime(totalSeconds);
}

function getCurrentWeekDays() {

    const today = new Date();
    const day   = today.getDay() || 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - day + 1);

    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d.toDateString();
    });
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

function resetWorkDay() {
    workDay = {
        date: null, startTime: null, endTime: null,
        startTimestamp: null, pausedAt: null,
        pausedTime: 0, totalSeconds: 0, email: null
    };
}

// ==========================
// RESTAURAR JORNADA ACTIVA AL CARGAR
// ==========================
function loadCurrentWorkDay() {

    const saved = localStorage.getItem('currentWorkDay');
    if (!saved) return;

    try {
        workDay = JSON.parse(saved);
    } catch (e) {
        return;
    }

    if (!workDay.endTime && !workDay.pausedAt) {
        startUIUpdater();
        statusBadge.textContent = 'En progreso';
        statusBadge.classList.remove('status-out', 'status-pause');
        statusBadge.classList.add('status-in');
        pauseButton.disabled = false;
        endButton.disabled   = false;

    } else if (workDay.pausedAt) {
        statusBadge.textContent = 'Descanso';
        statusBadge.classList.remove('status-out', 'status-in');
        statusBadge.classList.add('status-pause');
        pauseButton.disabled = false;
        endButton.disabled   = false;
    }

    updateTotalSeconds();
    updateDailyHours();
}

// ==========================
// INIT
// ==========================
loadCurrentWorkDay();
loadWeekWorkDays();
