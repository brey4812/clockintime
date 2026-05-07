document.addEventListener('DOMContentLoaded', () => {

    // =============================
    // ELEMENTOS DEL DOM
    // =============================
    const userNameHeader     = document.getElementById('user-name-header');
    const inviteCodeDisplay  = document.getElementById('invite-code-display');
    const btnGenerarCodigo   = document.getElementById('btn-generar-codigo');
    const btnCopiarCodigo    = document.getElementById('btn-copiar-codigo');
    const inputNombreEmpresa = document.getElementById('input-nombre-empresa');
    const inputPlanActual    = document.getElementById('input-plan-actual');

    // =============================
    // HELPERS
    // =============================
    function getJefeActual() {
        const email = localStorage.getItem('currentUserEmail');
        if (!email) return null;
        try { return JSON.parse(localStorage.getItem(email)); } catch { return null; }
    }

    function getEmpresaActual() {
        const jefe = getJefeActual();
        if (!jefe) return null;
        const empresas = JSON.parse(localStorage.getItem('empresas')) || [];
        return empresas.find(e => e.code === jefe.companyCode) || null;
    }

    // =============================
    // CARGAR DATOS EN PANTALLA
    // =============================
    function cargarDatosEmpresa() {

        const jefe    = getJefeActual();
        const empresa = getEmpresaActual();

        if (jefe && userNameHeader) {
            userNameHeader.textContent = jefe.fullname || jefe.email;
        }

        if (empresa) {
            if (inviteCodeDisplay)  inviteCodeDisplay.textContent = empresa.code || '—';
            if (inputNombreEmpresa) inputNombreEmpresa.value      = empresa.name || '';
        } else {
            if (inviteCodeDisplay) inviteCodeDisplay.textContent  = '—';
        }

        if (inputPlanActual) {
            inputPlanActual.value = localStorage.getItem('planEmpresa') || 'Plan Básico';
        }
    }

    // =============================
    // GENERAR NUEVO CÓDIGO DE EMPRESA
    // (actualiza la empresa Y el companyCode de TODOS sus empleados para no dejarlos sin acceso)
    // =============================
    function generarNuevoCodigo() {

        if (!confirm('¿Seguro que quieres generar un nuevo código?\nEl código antiguo dejará de funcionar para nuevos registros.')) {
            return;
        }

        const jefe     = getJefeActual();
        if (!jefe) { alert('No se encontró sesión activa.'); return; }

        const empresas = JSON.parse(localStorage.getItem('empresas')) || [];
        const idx      = empresas.findIndex(e => e.code === jefe.companyCode);

        if (idx === -1) { alert('No se encontró tu empresa.'); return; }

        const nuevoCodigo = generarCodigoAleatorio();
        const codigoViejo = empresas[idx].code;

        // 1. Actualizar la empresa
        empresas[idx].code = nuevoCodigo;
        localStorage.setItem('empresas', JSON.stringify(empresas));

        // 2. Actualizar el companyCode del jefe en sesión
        jefe.companyCode = nuevoCodigo;
        localStorage.setItem(jefe.email, JSON.stringify(jefe));

        // 3. Actualizar el companyCode de todos los empleados de la empresa
        //    para que puedan seguir haciendo login sin problemas
        empresas[idx].employees.forEach(emailEmp => {
            try {
                const ud = localStorage.getItem(emailEmp);
                if (!ud) return;
                const emp = JSON.parse(ud);
                if (emp.companyCode === codigoViejo) {
                    emp.companyCode = nuevoCodigo;
                    localStorage.setItem(emailEmp, JSON.stringify(emp));
                }
            } catch { /* ignoramos claves corruptas */ }
        });

        // 4. Actualizar la referencia de sesión (no cambia el email, solo refrescamos)
        localStorage.setItem('currentUserEmail', jefe.email);

        if (inviteCodeDisplay) inviteCodeDisplay.textContent = nuevoCodigo;

        alert(`Nuevo código generado: ${nuevoCodigo}\n\nCompártelo con tus empleados para que nuevas personas puedan unirse.`);
    }

    // =============================
    // CÓDIGO ALEATORIO (8 caracteres, más robusto)
    // =============================
    function generarCodigoAleatorio() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin caracteres ambiguos
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    // =============================
    // COPIAR CÓDIGO AL PORTAPAPELES
    // =============================
    function copiarCodigo() {

        const codigo = inviteCodeDisplay ? inviteCodeDisplay.textContent.trim() : '';

        if (!codigo || codigo === '—') {
            alert('No hay ningún código que copiar.');
            return;
        }

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(codigo)
                .then(() => alert('Código copiado al portapapeles.'))
                .catch(() => copiarFallback(codigo));
        } else {
            copiarFallback(codigo);
        }
    }

    function copiarFallback(texto) {
        const tmp = document.createElement('input');
        tmp.value = texto;
        tmp.style.position = 'fixed';
        tmp.style.opacity  = '0';
        document.body.appendChild(tmp);
        tmp.focus();
        tmp.select();
        try {
            document.execCommand('copy');
            alert('Código copiado.');
        } catch {
            alert(`Tu código es: ${texto}\n(Cópialo manualmente)`);
        }
        document.body.removeChild(tmp);
    }

    // =============================
    // EVENTOS
    // =============================
    btnGenerarCodigo?.addEventListener('click', generarNuevoCodigo);
    btnCopiarCodigo?.addEventListener('click',  copiarCodigo);

    // =============================
    // INIT
    // =============================
    cargarDatosEmpresa();
});
