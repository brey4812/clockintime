
//elementos del DOM (request-type, start-date, end-date, comments y btn-submit-request)
const requestTypeSelect = document.getElementById('request-type');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const commentsInput = document.getElementById('comments');
const submitButton = document.getElementById('btn-submit-request');
//elemento para el historial de solicitudes
const requestHistoryElement = document.getElementById('historial-solicitudes-tbody');

//objeto de solicitud
let request = {
    type: 'vacaciones',
    startDate: '',
    endDate: '',
    comments: '',
    estado: 'Pendiente'
};

//eventos
    //se actualiza el tipo de solicitud y se mete en el objeto
    requestTypeSelect.addEventListener('change', function() {
    request.type = requestTypeSelect.value;
    });
    //se actualiza la fecha de inicio y se mete en el objeto
    startDateInput.addEventListener('change', function() {
    request.startDate = startDateInput.value;
    
    });
    //se actualiza la fecha de final y se mete en el objeto
    endDateInput.addEventListener('change', function() {
    request.endDate = endDateInput.value;
    });
    //se actualizan los comentarios y se meten en el objeto
    commentsInput.addEventListener('input', function() {
    request.comments = commentsInput.value;
    });

    //al hacer eviar la solicitud verificamos que los campos obligatorios esten completos
    submitButton.addEventListener('click', function(event) {
    event.preventDefault();
    if (validateRequest()) {
        //se envia la solicitud a la base de datos(localStorage de momento y se actualiza el historial)
        saveRequest(request);
        updateRequestHistory();
        //se resetea el formulario
        resetForm();
    }
    });

//inicializamos el historial de solicitudes al cargar la pagina
updateRequestHistory();
//funciones

    //comprobamos que los campos de tipo de solicitud, fecha de inicio y fecha de fin no esten vacios si esta vacio sacamos una alerta 
    // y no dejamos enviar la solicitud
    function validateRequest() {
    if (request.type === '' || request.startDate === '' || request.endDate === '') {
        alert('Por favor, complete todos los campos obligatorios.');
        return false;
    }
    return true;
    };
    //guardamos la solicitud en el localStorage con la clave 'solicitudes'
    function saveRequest(request) {
    let requests = JSON.parse(localStorage.getItem('solicitudes')) || [];
    requests.push(request);
    localStorage.setItem('solicitudes', JSON.stringify(requests));
    }
    //actualizamos el historial de solicitudes usando el localStorage y ponemos el estado de pendiente
    function updateRequestHistory() {
    let requests = JSON.parse(localStorage.getItem('solicitudes')) || [];
    requestHistoryElement.innerHTML = '';
    requests.forEach(function(req, index) {
        let row = document.createElement('tr');
        row.innerHTML = `
        <td>${req.type}</td>
        <td>${req.startDate}</td>
        <td>${req.endDate}</td>
        <td><span class="status-badge status-pending">${req.estado}</span></td>
        `;
        requestHistoryElement.appendChild(row);
    });
    }
    //reseteamos el formulario y el objeto solicitud
    function resetForm() {
    requestTypeSelect.value = "vacaciones";
    startDateInput.value = '';
    endDateInput.value = '';
    commentsInput.value = '';
    request = {
        type: '',
        startDate: '',
        endDate: '',
        comments: '',
        estado: 'Pendiente'
    };
    }
