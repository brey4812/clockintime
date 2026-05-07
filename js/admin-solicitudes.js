document.addEventListener('DOMContentLoaded', () => {

    // =============================
    // ELEMENTOS DEL DOM
    // =============================
    const solicitudesTbody = document.getElementById('solicitudes-admin-tbody');
    const filtroPendientes = document.getElementById('filtro-pendientes');
    const filtroAprobadas  = document.getElementById('filtro-aprobadas');
    const filtroRechazadas = document.getElementById('filtro-rechazadas');
    const filtroTodas      = document.getElementById('filtro-todas');
    const userNameHeader   = document.getElementById('user-name-header');

    // =============================
    // ESTADO
    // =============================
    let filtroActivo = 'todas';

    // =============================
    // HELPERS
    // =============================
    function getJefeActual() {
        const email = localStorage.getItem('currentUserEmail');
        if (!email) return null;
        try { return JSON.parse(localStorage.getItem(email)); } catch { return null; }
    }

    function getEmailsEmpleados() {
        const jefe = getJefeActual();
        if (!jefe) return [];
        const empresas = JSON.parse(localStorage.getItem('empresas')) || [];
        const empresa  = empresas.find(e => e.code === jefe.companyCode);
        return empresa ? empresa.employees : [];
    }

    // =============================
    // OBTENER SOLICITUDES DE TODOS LOS EMPLEADOS
    // (solo lee claves individuales solicitudes_email — sin duplicados)
    // =============================
    function getSolicitudesEmpresa() {

        const emails    = getEmailsEmpleados();
        const resultado = [];

        emails.forEach(email => {
            const key  = `solicitudes_${email}`;
            const sols = JSON.parse(localStorage.getItem(key)) || [];
            sols.forEach((sol, idx) => {
                resultado.push({
                    ...sol,
                    emailEmpleado: email,
                    _storageKey:   key,
                    _idx:          idx   // índice real en el array de ese empleado
                });
            });
        });

        return resultado;
    }

    // =============================
    // RENDERIZAR TABLA
    // =============================
    function renderTablaSolicitudes() {

        if (!solicitudesTbody) return;

        let solicitudes = getSolicitudesEmpresa();

        // Filtro activo
        if (filtroActivo !== 'todas') {
            solicitudes = solicitudes.filter(s =>
                (s.estado || 'Pendiente').toLowerCase() === filtroActivo.toLowerCase()
            );
        }

        solicitudesTbody.innerHTML = '';

        if (solicitudes.length === 0) {
            solicitudesTbody.innerHTML = `
                <tr><td colspan="6" class="text-center">No hay solicitudes que mostrar.</td></tr>`;
            return;
        }

        solicitudes.forEach(sol => {

            let empleado = null;
            try {
                const ud = localStorage.getItem(sol.emailEmpleado);
                if (ud) empleado = JSON.parse(ud);
            } catch { /* ignoramos */ }

            const nombreEmp  = empleado ? (empleado.fullname || sol.emailEmpleado) : sol.emailEmpleado;
            const estadoReal = sol.estado || 'Pendiente';
            const estadoLow  = estadoReal.toLowerCase();
            let estadoClase  = 'status-pending';
            if (estadoLow === 'aprobada')  estadoClase = 'status-approved';
            if (estadoLow === 'rechazada') estadoClase = 'status-rejected';

            const esPendiente = estadoLow === 'pendiente';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${nombreEmp}</td>
                <td>${sol.type || '-'}</td>
                <td>${sol.startDate || '-'}</td>
                <td>${sol.endDate || '-'}</td>
                <td><span class="status-badge ${estadoClase}">${estadoReal}</span></td>
                <td class="actions-cell">
                    ${esPendiente ? `
                        <button class="btn-action btn-aprobar" title="Aprobar">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-action btn-rechazar" title="Rechazar">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : '<span style="color:var(--text-light);font-size:0.85rem;">—</span>'}
                </td>`;

            // Guardamos referencia al objeto en el propio row (no en dataset)
            // para que los botones siempre lean el dato correcto
            if (esPendiente) {
                row.querySelector('.btn-aprobar').addEventListener('click', () =>
                    procesarSolicitud(sol, 'Aprobada'));
                row.querySelector('.btn-rechazar').addEventListener('click', () =>
                    procesarSolicitud(sol, 'Rechazada'));
            }

            solicitudesTbody.appendChild(row);
        });
    }

    // =============================
    // PROCESAR SOLICITUD (aprobar / rechazar)
    // (actualiza el estado en la clave individual del empleado)
    // =============================
    function procesarSolicitud(sol, nuevoEstado) {

        const sols = JSON.parse(localStorage.getItem(sol._storageKey)) || [];

        // Buscamos por índice real guardado al leer
        if (sols[sol._idx] !== undefined) {
            sols[sol._idx].estado = nuevoEstado;
            localStorage.setItem(sol._storageKey, JSON.stringify(sols));
        }

        // Si se aprueba, lo añadimos al calendario del empleado
        if (nuevoEstado === 'Aprobada') {
            actualizarCalendarioEmpleado(sol);
        }

        alert(`Solicitud ${nuevoEstado.toLowerCase()} correctamente.`);
        renderTablaSolicitudes();
    }

    // =============================
    // AÑADIR SOLICITUD APROBADA AL CALENDARIO DEL EMPLEADO
    // =============================
    function actualizarCalendarioEmpleado(sol) {

        if (!sol.emailEmpleado) return;

        const keyEventos = `eventos_${sol.emailEmpleado}`;
        const eventos    = JSON.parse(localStorage.getItem(keyEventos)) || [];

        // Evitamos duplicados
        const yaExiste = eventos.some(e =>
            e.type      === sol.type &&
            e.startDate === sol.startDate &&
            e.endDate   === sol.endDate &&
            e.category  === 'Solicitud'
        );

        if (!yaExiste) {
            eventos.push({
                type:      sol.type,
                startDate: sol.startDate,
                endDate:   sol.endDate,
                comments:  sol.comments || '',
                estado:    'Aprobada',
                category:  'Solicitud'
            });
            localStorage.setItem(keyEventos, JSON.stringify(eventos));
        }
    }

    // =============================
    // FILTROS
    // =============================
    function activarFiltro(nuevoFiltro, btnActivo) {
        filtroActivo = nuevoFiltro;
        [filtroPendientes, filtroAprobadas, filtroRechazadas, filtroTodas]
            .forEach(b => b?.classList.remove('active'));
        btnActivo?.classList.add('active');
        renderTablaSolicitudes();
    }

    filtroTodas?.addEventListener('click',      () => activarFiltro('todas',     filtroTodas));
    filtroPendientes?.addEventListener('click', () => activarFiltro('Pendiente', filtroPendientes));
    filtroAprobadas?.addEventListener('click',  () => activarFiltro('Aprobada',  filtroAprobadas));
    filtroRechazadas?.addEventListener('click', () => activarFiltro('Rechazada', filtroRechazadas));

    // =============================
    // CARGAR NOMBRE EN HEADER
    // =============================
    function cargarNombreHeader() {
        const jefe = getJefeActual();
        if (jefe && userNameHeader) userNameHeader.textContent = jefe.fullname || jefe.email;
    }

    // =============================
    // INIT
    // =============================
    cargarNombreHeader();
    renderTablaSolicitudes();
});
