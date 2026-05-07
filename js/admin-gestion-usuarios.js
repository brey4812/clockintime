document.addEventListener('DOMContentLoaded', () => {

    // =============================
    // ELEMENTOS DEL DOM
    // =============================
    const usuariosTbody     = document.getElementById('usuarios-tbody');
    const btnAnadirUsuario  = document.getElementById('btn-anadir-usuario');
    const userNameHeader    = document.getElementById('user-name-header');

    // Modal añadir/editar usuario
    const modal             = document.getElementById('modal-usuario');
    const modalTitle        = document.getElementById('modal-usuario-titulo');
    const btnCerrarModal    = document.getElementById('btn-cerrar-modal-usuario');
    const formUsuario       = document.getElementById('form-usuario-modal');
    const inputNombre       = document.getElementById('modal-input-nombre');
    const inputEmail        = document.getElementById('modal-input-email');
    const inputRol          = document.getElementById('modal-input-rol');
    const inputPassword     = document.getElementById('modal-input-password');

    // =============================
    // ESTADO
    // (email del usuario que se está editando, null si es uno nuevo)
    // =============================
    let emailEditando = null;

    // =============================
    // CARGAR JEFE ACTUAL
    // (obtenemos los datos del jefe que ha iniciado sesión para mostrar su nombre y acceder a su empresa)
    // =============================
    function getJefeActual() {
        const email = localStorage.getItem('currentUserEmail');
        if (!email) return null;
        return JSON.parse(localStorage.getItem(email));
    }

    // =============================
    // OBTENER EMPLEADOS DE LA EMPRESA
    // (buscamos en localStorage todos los usuarios que pertenezcan a la misma empresa que el jefe)
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
    // RENDERIZAR TABLA DE USUARIOS
    // (pintamos cada usuario en la tabla con su foto, nombre, email, rol y botones de acción)
    // =============================
    function renderTablaUsuarios() {

        if (!usuariosTbody) return;

        const empleados = getEmpleadosEmpresa();
        const jefe      = getJefeActual();

        usuariosTbody.innerHTML = '';

        if (empleados.length === 0) {
            usuariosTbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">No hay usuarios en tu empresa todavía.</td>
                </tr>`;
            return;
        }

        empleados.forEach(emp => {

            const esJefe    = emp.boss === true;
            const esMismo   = jefe && emp.email === jefe.email;
            const rolLabel  = esJefe ? 'Jefe' : 'Empleado';
            const rolClase  = esJefe ? 'role-admin' : 'role-employee';

            // Foto de perfil o icono por defecto
            const fotoKey  = `profilePic_${emp.email}`;
            const fotoData = localStorage.getItem(fotoKey);
            const fotoHTML = fotoData
                ? `<img src="${fotoData}" alt="Foto">`
                : `<i class="fas fa-user"></i>`;

            const row = document.createElement('tr');
            row.dataset.email = emp.email;

            row.innerHTML = `
                <td>
                    <div class="table-profile-pic">${fotoHTML}</div>
                </td>
                <td>${emp.fullname || '-'}</td>
                <td>${emp.email}</td>
                <td><span class="role-badge ${rolClase}">${rolLabel}</span></td>
                <td class="actions-cell">
                    <button class="btn-action btn-edit" data-email="${emp.email}" title="Editar">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button class="btn-action btn-delete" data-email="${emp.email}"
                        ${esMismo ? 'disabled title="No puedes eliminarte a ti mismo"' : 'title="Eliminar"'}>
                        <i class="fas fa-trash"></i>
                    </button>
                </td>`;

            usuariosTbody.appendChild(row);
        });

        // Eventos de los botones generados dinámicamente
        usuariosTbody.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => abrirModalEditar(btn.dataset.email));
        });

        usuariosTbody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => eliminarUsuario(btn.dataset.email));
        });
    }

    // =============================
    // ABRIR MODAL NUEVO USUARIO
    // =============================
    function abrirModalNuevo() {

        emailEditando = null;

        if (modalTitle)   modalTitle.textContent   = 'Añadir Usuario';
        if (inputNombre)  inputNombre.value         = '';
        if (inputEmail)   inputEmail.value          = '';
        if (inputEmail)   inputEmail.disabled       = false;
        if (inputRol)     inputRol.value            = 'empleado';
        if (inputPassword) inputPassword.value      = '';

        mostrarModal();
    }

    // =============================
    // ABRIR MODAL EDITAR USUARIO
    // (precargamos el modal con los datos del usuario seleccionado)
    // =============================
    function abrirModalEditar(email) {

        const userData = localStorage.getItem(email);
        if (!userData) return;

        const emp     = JSON.parse(userData);
        emailEditando = email;

        if (modalTitle)   modalTitle.textContent   = 'Editar Usuario';
        if (inputNombre)  inputNombre.value         = emp.fullname || '';
        if (inputEmail)   inputEmail.value          = emp.email;
        if (inputEmail)   inputEmail.disabled       = true; // no se puede cambiar el email
        if (inputRol)     inputRol.value            = emp.boss ? 'jefe' : 'empleado';
        if (inputPassword) inputPassword.value      = '';   // no mostramos la contraseña actual

        mostrarModal();
    }

    // =============================
    // GUARDAR USUARIO (nuevo o editado)
    // =============================
    function guardarUsuario(event) {

        event.preventDefault();

        const nombre   = inputNombre  ? inputNombre.value.trim()   : '';
        const email    = inputEmail   ? inputEmail.value.trim()    : '';
        const rol      = inputRol     ? inputRol.value             : 'empleado';
        const password = inputPassword ? inputPassword.value.trim() : '';

        if (!nombre || !email) {
            alert('El nombre y el email son obligatorios.');
            return;
        }

        const jefe    = getJefeActual();
        const empresas = JSON.parse(localStorage.getItem('empresas')) || [];
        const empresa  = empresas.find(e => e.code === jefe.companyCode);

        if (emailEditando) {
            // ==== EDITAR usuario existente ====
            const userData = JSON.parse(localStorage.getItem(emailEditando));
            userData.fullname = nombre;
            userData.boss     = (rol === 'jefe');

            if (password) {
                userData.password = password;
            }

            localStorage.setItem(emailEditando, JSON.stringify(userData));
            alert('Usuario actualizado correctamente.');

        } else {
            // ==== NUEVO usuario ====
            const yaExiste = localStorage.getItem(email);
            if (yaExiste) {
                alert('Ya existe un usuario con ese email.');
                return;
            }

            const nuevoUsuario = {
                fullname:    nombre,
                email:       email,
                password:    password || '1234',
                company:     jefe.company || '',
                companyCode: jefe.companyCode,
                boss:        (rol === 'jefe')
            };

            localStorage.setItem(email, JSON.stringify(nuevoUsuario));

            // Añadimos el email a la lista de empleados de la empresa
            if (empresa && !empresa.employees.includes(email)) {
                empresa.employees.push(email);
                localStorage.setItem('empresas', JSON.stringify(empresas));
            }

            alert('Usuario añadido correctamente. Contraseña por defecto: 1234');
        }

        cerrarModal();
        renderTablaUsuarios();
    }

    // =============================
    // ELIMINAR USUARIO
    // =============================
    function eliminarUsuario(email) {

        if (!confirm(`¿Seguro que quieres eliminar al usuario ${email}?`)) return;

        const jefe    = getJefeActual();
        const empresas = JSON.parse(localStorage.getItem('empresas')) || [];
        const empresa  = empresas.find(e => e.code === jefe.companyCode);

        // Quitamos el email de la lista de empleados de la empresa
        if (empresa) {
            empresa.employees = empresa.employees.filter(e => e !== email);
            localStorage.setItem('empresas', JSON.stringify(empresas));
        }

        // Eliminamos los datos del usuario
        localStorage.removeItem(email);

        renderTablaUsuarios();
    }

    // =============================
    // CONTROL DEL MODAL
    // =============================
    function mostrarModal() {
        if (modal) modal.classList.remove('modal-hidden');
    }

    function cerrarModal() {
        if (modal) modal.classList.add('modal-hidden');
        emailEditando = null;
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
    // EVENTOS PRINCIPALES
    // =============================
    btnAnadirUsuario?.addEventListener('click', abrirModalNuevo);
    btnCerrarModal?.addEventListener('click', cerrarModal);
    formUsuario?.addEventListener('submit', guardarUsuario);

    // Cerrar modal al hacer clic en el overlay
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModal();
    });

    // =============================
    // INIT
    // =============================
    cargarNombreHeader();
    renderTablaUsuarios();
});
