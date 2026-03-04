// ==========================
// ELEMENTOS DEL DOM
// (los botones, el badge de estado y el resumen semanal que seran las cosas que utilicemos )
// ==========================
const startButton = document.getElementById('btn-clock-in');
const pauseButton = document.getElementById('btn-pause');
const endButton = document.getElementById('btn-end');
const statusBadge = document.getElementById('clock-status-badge');
const summaryElement = document.getElementById('summary-horas-semana');

// ==========================
// ESTADO DE LA JORNADA 
// (objeto que guarda la informacion de lo que esta ocurriendo)
// ==========================
let workDay = {
    date: null,
    startTime: null,
    endTime: null,
    startTimestamp: null,
    pausedAt: null,
    pausedTime: 0,
    totalSeconds: 0
};

let uiInterval = null;

// ==========================
// ESTADO INICIAL
//(como inicia la pagiana al cargar si no hay una jornada activa)
// ==========================
pauseButton.disabled = true;
endButton.disabled = true;

// ==========================
// EVENTOS
// (lo que ocurre al hacer click en los botones)
// ==========================
startButton.addEventListener('click', startWorkDay);
pauseButton.addEventListener('click', pauseWorkDay);
endButton.addEventListener('click', endWorkDay);

// ==========================
// FUNCIONES PRINCIPALES 
//(funciones basicas para iniciar, pausar y finalizar la jornada laboral)
// ==========================
function startWorkDay() { 
//(al empezar la jornada guardaremos la fecha de inicio, y actualizaremos los botones y la UI para reflejar el tiempo de trabajo)
    const now = new Date();

    if (!workDay.startTimestamp) {
        workDay.date = now.toISOString();
        workDay.startTime = now.toLocaleTimeString();
        workDay.startTimestamp = Date.now();
    }

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
    endButton.disabled = false;
}

function pauseWorkDay() {
//si necesitamos pausar el tiempo de trabajo guardamos el momento en que se pausa y actualizamos la UI para reflejar el estado de descanso
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
//decimos que ha finalizado la jornada y actualizamos el trabajo total y lo guardamos en el historial
    stopUIUpdater();

    workDay.endTime = new Date().toLocaleTimeString();
    updateTotalSeconds();

    saveWorkDay(workDay);
    localStorage.removeItem('currentWorkDay');

    resetWorkDay();
    loadWeekWorkDays();

    statusBadge.textContent = 'Fuera de servicio';
    statusBadge.classList.remove('status-in', 'status-pause');
    statusBadge.classList.add('status-out');

    pauseButton.disabled = true;
    endButton.disabled = true;
}

// ==========================
// UI UPDATER (NO CUENTA TIEMPO)
// ==========================
function startUIUpdater() {
//actualiza la UI cada segundo sin afectar al calculo real
    if (uiInterval) return;

    uiInterval = setInterval(() => {
        updateTotalSeconds();
        updateDailyHours();
    }, 1000);
}

function stopUIUpdater() {
//para la actualizacion de la UI cada segundo sin afectar al calculo real
    clearInterval(uiInterval);
    uiInterval = null;
}

// ==========================
// CALCULO REAL DE TIEMPO
// ==========================
function updateTotalSeconds() {
//calcula el tiempo real transcurrido desde el inicio de la jornada, restando los tiempos de pausa y actualizando el total de segundos trabajados
    if (!workDay.startTimestamp) return;

    const now = Date.now();
    const paused = workDay.pausedAt
        ? now - workDay.pausedAt
        : 0;

    const elapsed =
        now - workDay.startTimestamp - workDay.pausedTime - paused;

    workDay.totalSeconds = Math.floor(elapsed / 1000);
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
// UI 
//actualiza el resumen diario y semanal en la UI para mostrar el tiempo trabajado
// ==========================
function updateDailyHours() {
    const el = document.getElementById('summary-horas-hoy');
    if (el) el.textContent = formatTime(workDay.totalSeconds);
}

// ==========================
// CALCULO SEMANAL
// ==========================
function loadWeekWorkDays() {
//calcula el total de horas trabajadas en la semana y actualiza el resumen semanal
    const history = JSON.parse(localStorage.getItem('workDays')) || [];
    const currentWeek = getCurrentWeekDays();
    let totalSeconds = 0;

    history.forEach(day => {
        const dayDate = new Date(day.date);
        if (currentWeek.includes(dayDate.toDateString())) {
            totalSeconds += day.totalSeconds;
        }
    });

    summaryElement.textContent =
        `Horas trabajadas esta semana: ${formatTime(totalSeconds)}`;
}

function getCurrentWeekDays() {
//obtiene las fechas de la semana actual (de lunes a domingo) para comparar con el historial de jornadas y calcular el total semanal
    const today = new Date();
    const day = today.getDay() || 7;
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
    //cambiamos los segundos totales a un formato de horas, minutos y segundos para mostrar en la UI
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
}

function resetWorkDay() {
    workDay = {
        date: null,
        startTime: null,
        endTime: null,
        startTimestamp: null,
        pausedAt: null,
        pausedTime: 0,
        totalSeconds: 0
    };
}

// ==========================
// RESTAURAR JORNADA ACTIVA
// ==========================
function loadCurrentWorkDay() {
    //al cargar la pagina comprobamos si hay una jornada activa en el localStorage y restauramos su estado para continuar contando el tiempo correctamente
    const saved = localStorage.getItem('currentWorkDay');
    if (!saved) return;

    workDay = JSON.parse(saved);

    if (!workDay.endTime && !workDay.pausedAt) {
        startUIUpdater();

        statusBadge.textContent = 'En progreso';
        statusBadge.classList.add('status-in');
        pauseButton.disabled = false;
        endButton.disabled = false;
    } else if (workDay.pausedAt) {
        statusBadge.textContent = 'Descanso';
        statusBadge.classList.add('status-pause');
        pauseButton.disabled = false;
        endButton.disabled = false;
    }

    updateTotalSeconds();
    updateDailyHours();
}

// ==========================
// INIT
// al cargar la pagina restauramos cualquier jornada activa y calculamos el resumen semanal para mostrar en el dashboard
// ==========================
loadCurrentWorkDay();
loadWeekWorkDays();
