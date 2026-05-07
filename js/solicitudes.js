//elementos del DOM
const requestTypeSelect = document.getElementById('request-type');
const startDateInput    = document.getElementById('start-date');
const endDateInput      = document.getElementById('end-date');
const commentsInput     = document.getElementById('comments');
const submitButton      = document.getElementById('btn-submit-request');
const requestHistoryElement = document.getElementById('historial-solicitudes-tbody');

//objeto de solicitud
let request = {
    type: 'vacaciones',
    startDate: '',
    endDate: '',
    comments: '',
    estado: 'Pendiente'
};

//eventos — sincronizamos el objeto con el formulario en tiempo real
requestTypeSelect.addEventListener('change', () => { request.type = requestTypeSelect.value; });
startDateInput.addEventListener('change',   () => { request.startDate = startDateInput.value; });
endDateInput.addEventListener('change',     () => { request.endDate = endDateInput.value; });
commentsInput.addEventListener('input',     () => { request.comments = commentsInput.value; });

submitButton.addEventListener('click', function(event) {
    event.preventDefault();
    if (validateRequest()) {
        saveRequest(request);
        updateRequestHistory();
        resetForm();
    }
});

//inicializamos el historial al cargar la página
updateRequestHistory();

// ==========================
// VALIDAR SOLICITUD
// ==========================
function validateRequest() {
    if (!request.type || !request.startDate || !request.endDate) {
        alert('Por favor, completa todos los campos obligatorios.');
        return false;
    }
    if (request.endDate < request.startDate) {
        alert('La fecha de fin no puede ser anterior a la de inicio.');
        return false;
    }
    return true;
}

// ==========================
// GUARDAR SOLICITUD
// (guardamos SOLO en la clave individual del empleado para evitar duplicados en el panel de jefes)
// ==========================
function saveRequest(req) {

    const currentEmail = localStorage.getItem('currentUserEmail') || '';

    // Añadimos el email al objeto para que el jefe sepa de quién es
    const solicitud = { ...req, emailEmpleado: currentEmail };

    if (currentEmail) {
        const key      = 'solicitudes_' + currentEmail;
        const requests = JSON.parse(localStorage.getItem(key)) || [];
        requests.push(solicitud);
        localStorage.setItem(key, JSON.stringify(requests));
    }
}

// ==========================
// ACTUALIZAR HISTORIAL EN PANTALLA
// (leemos las solicitudes individuales del empleado en sesión)
// ==========================
function updateRequestHistory() {

    const currentEmail = localStorage.getItem('currentUserEmail') || '';
    let requests = [];

    if (currentEmail) {
        requests = JSON.parse(localStorage.getItem('solicitudes_' + currentEmail)) || [];
    }

    requestHistoryElement.innerHTML = '';

    if (requests.length === 0) {
        requestHistoryElement.innerHTML = `
            <tr><td colspan="4" class="text-center">No tienes solicitudes registradas.</td></tr>`;
        return;
    }

    // Mostramos las más recientes primero
    [...requests].reverse().forEach(function(req) {

        let estadoClase = 'status-pending';
        if (req.estado === 'Aprobada')  estadoClase = 'status-approved';
        if (req.estado === 'Rechazada') estadoClase = 'status-rejected';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${req.type || '-'}</td>
            <td>${req.startDate || '-'}</td>
            <td>${req.endDate || '-'}</td>
            <td><span class="status-badge ${estadoClase}">${req.estado || 'Pendiente'}</span></td>`;
        requestHistoryElement.appendChild(row);
    });
}

// ==========================
// RESETEAR FORMULARIO
// ==========================
function resetForm() {
    requestTypeSelect.value = 'vacaciones';
    startDateInput.value    = '';
    endDateInput.value      = '';
    commentsInput.value     = '';
    request = { type: 'vacaciones', startDate: '', endDate: '', comments: '', estado: 'Pendiente' };
}
