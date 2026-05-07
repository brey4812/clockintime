document.addEventListener('DOMContentLoaded', () => {

    // =============================
    // ELEMENTOS DEL DOM
    // =============================
    const userNameHeader        = document.getElementById('user-name-header');
    const statUsuariosTotales   = document.getElementById('summary-usuarios-totales');
    const statSolicitudesPend   = document.getElementById('summary-solicitudes-pendientes');
    const statFichadosHoy       = document.getElementById('summary-fichados-hoy');
    const listaSolicitudesPend  = document.getElementById('lista-solicitudes-pendientes');

    // =============================
    // CARGAR JEFE ACTUAL
    // =============================
    function getJefeActual() {
        const email = localStorage.getItem('currentUserEmail');
        if (!email) return null;
        return JSON.parse(localStorage.getItem(email));
    }

    // =============================
    // OBTENER EMPLEADOS DE LA EMPRESA
    // =============================
    function getEmpleadosEmpresa() {

        const jefe = getJefeActual();
        if (!jefe) return [];

        const empresas = JSON.parse(localStorage.getItem('empresas')) || [];
        const empresa  = empresas.find(e => e.code === jefe.companyCode);
        if (!empresa) return [];

        const empleados = [];
        empresa.employees.forEach(emailEmp => {
            const userData = localStorage.getItem(emailEmp);
            if (userData) {
                try {
                    empleados.push(JSON.parse(userData));
                } catch (err) {
                    console.warn('Error parseando usuario:', emailEmp);
                }
            }
        });

        return empleados;
    }

    // =============================
    // OBTENER SOLICITUDES PENDIENTES DE LA EMPRESA
    // (miramos tanto las solicitudes globales como las individuales por empleado)
    // =============================
    function getSolicitudesPendientes() {

        const empleados  = getEmpleadosEmpresa();
        const pendientes = [];

        // Solicitudes en la clave global (compatibilidad)
        const globales = JSON.parse(localStorage.getItem('solicitudes')) || [];
        globales.forEach(sol => {
            if ((sol.estado || 'Pendiente') === 'Pendiente') {
                pendientes.push(sol);
            }
        });

        // Solicitudes individuales por empleado
        empleados.forEach(emp => {
            const key  = `solicitudes_${emp.email}`;
            const sols = JSON.parse(localStorage.getItem(key)) || [];
            sols.forEach(sol => {
                if ((sol.estado || 'Pendiente') === 'Pendiente') {
                    pendientes.push({ ...sol, emailEmpleado: emp.email });
                }
            });
        });

        return pendientes;
    }

    // =============================
    // CALCULAR FICHADOS HOY
    // (contamos cuántos empleados han fichado hoy comparando la fecha de su jornada actual)
    // =============================
    function countFichadosHoy() {

        const empleados = getEmpleadosEmpresa();
        const hoy       = new Date().toDateString();
        let count       = 0;

        empleados.forEach(emp => {
            // Miramos si tienen una jornada activa guardada
            const keyJornada = `currentWorkDay_${emp.email}`;
            const jornada    = localStorage.getItem(keyJornada);

            if (jornada) {
                try {
                    const j = JSON.parse(jornada);
                    if (j.date && new Date(j.date).toDateString() === hoy) {
                        count++;
                    }
                } catch (err) {
                    // ignoramos claves corruptas
                }
            }

            // También miramos la clave global por si el empleado usa la clave sin prefijo
            const jornadaGlobal = localStorage.getItem('currentWorkDay');
            if (jornadaGlobal) {
                try {
                    const j = JSON.parse(jornadaGlobal);
                    // Solo la contamos si es de este empleado (usamos email si está guardado)
                    if (j.date && new Date(j.date).toDateString() === hoy && j.email === emp.email) {
                        count++;
                    }
                } catch (err) { /* ignoramos */ }
            }
        });

        return count;
    }

    // =============================
    // RENDERIZAR ESTADÍSTICAS
    // =============================
    function renderStats() {

        const empleados  = getEmpleadosEmpresa();
        const pendientes = getSolicitudesPendientes();
        const fichados   = countFichadosHoy();

        if (statUsuariosTotales) statUsuariosTotales.textContent = empleados.length;
        if (statSolicitudesPend) statSolicitudesPend.textContent = pendientes.length;
        if (statFichadosHoy)     statFichadosHoy.textContent     = fichados;
    }

    // =============================
    // RENDERIZAR LISTA DE SOLICITUDES PENDIENTES RECIENTES
    // (mostramos las últimas solicitudes que esperan aprobación en el dashboard)
    // =============================
    function renderSolicitudesPendientes() {

        if (!listaSolicitudesPend) return;

        const pendientes = getSolicitudesPendientes();

        listaSolicitudesPend.innerHTML = '';

        if (pendientes.length === 0) {
            listaSolicitudesPend.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">No hay solicitudes pendientes.</td>
                </tr>`;
            return;
        }

        // Mostramos las 5 más recientes
        pendientes.slice(-5).reverse().forEach(sol => {

            const emailEmp  = sol.emailEmpleado || 'Sin asignar';
            const userData  = emailEmp !== 'Sin asignar' ? localStorage.getItem(emailEmp) : null;
            const empleado  = userData ? JSON.parse(userData) : null;
            const nombre    = empleado ? (empleado.fullname || emailEmp) : emailEmp;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${nombre}</td>
                <td>${sol.type || '-'}</td>
                <td>${sol.startDate || '-'} / ${sol.endDate || '-'}</td>
                <td><span class="status-badge status-pending">Pendiente</span></td>`;

            listaSolicitudesPend.appendChild(row);
        });
    }

    // =============================
    // CARGAR NOMBRE DEL JEFE EN HEADER
    // =============================
    function cargarNombreHeader() {
        const jefe = getJefeActual();
        if (jefe && userNameHeader) {
            userNameHeader.textContent = jefe.fullname || jefe.email;
        }
    }

    // =============================
    // INIT
    // =============================
    cargarNombreHeader();
    renderStats();
    renderSolicitudesPendientes();
});
