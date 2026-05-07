document.addEventListener('DOMContentLoaded', () => {

    // =============================
    // ELEMENTOS DEL DOM
    // =============================
    const userNameHeader    = document.getElementById('user-name-header');
    const profileForm       = document.getElementById('profile-form');
    const passwordForm      = document.getElementById('password-form');
    const inputFullname     = document.getElementById('fullname');
    const inputEmail        = document.getElementById('email');
    const inputRol          = document.getElementById('role');
    const profilePicPreview = document.getElementById('profile-pic-preview');
    const btnUploadPic      = document.getElementById('btn-upload-pic');
    const inputPicUpload    = document.getElementById('input-pic-upload');
    const btnRemovePic      = document.getElementById('btn-remove-pic');
    const inputCurrentPass  = document.getElementById('current-password');
    const inputNewPass      = document.getElementById('new-password');
    const inputRepeatPass   = document.getElementById('repeat-password');

    // =============================
    // CARGAR JEFE ACTUAL
    // =============================
    function getJefeActual() {
        const email = localStorage.getItem('currentUserEmail');
        if (!email) return null;
        return JSON.parse(localStorage.getItem(email));
    }

    // =============================
    // CARGAR DATOS EN EL FORMULARIO
    // (rellenamos los campos con los datos guardados del jefe)
    // =============================
    function cargarDatosPerfil() {

        const jefe = getJefeActual();
        if (!jefe) return;

        if (inputFullname)  inputFullname.value = jefe.fullname || '';
        if (inputEmail)     inputEmail.value    = jefe.email    || '';
        if (inputRol)       inputRol.value      = jefe.boss ? 'Administrador' : 'Jefe de equipo';
        if (userNameHeader) userNameHeader.textContent = jefe.fullname || jefe.email;

        // Cargamos la foto de perfil si existe
        const fotoKey  = `profilePic_${jefe.email}`;
        const fotoData = localStorage.getItem(fotoKey);

        if (fotoData && profilePicPreview) {
            profilePicPreview.innerHTML = `<img src="${fotoData}" alt="Foto de perfil">`;
        }
    }

    // =============================
    // GUARDAR DATOS DEL PERFIL
    // =============================
    function guardarPerfil(event) {

        event.preventDefault();

        const email = localStorage.getItem('currentUserEmail');
        if (!email) return;

        const jefe = JSON.parse(localStorage.getItem(email));
        if (!jefe)  return;

        const nuevoNombre = inputFullname ? inputFullname.value.trim() : '';

        if (!nuevoNombre) {
            alert('El nombre no puede estar vacío.');
            return;
        }

        jefe.fullname = nuevoNombre;
        localStorage.setItem(email, JSON.stringify(jefe));

        if (userNameHeader) userNameHeader.textContent = nuevoNombre;

        alert('Perfil actualizado correctamente.');
    }

    // =============================
    // CAMBIAR CONTRASEÑA
    // =============================
    function cambiarPassword(event) {

        event.preventDefault();

        const email = localStorage.getItem('currentUserEmail');
        if (!email) return;

        const jefe = JSON.parse(localStorage.getItem(email));
        if (!jefe)  return;

        const currentPass = inputCurrentPass ? inputCurrentPass.value : '';
        const newPass     = inputNewPass     ? inputNewPass.value     : '';
        const repeatPass  = inputRepeatPass  ? inputRepeatPass.value  : '';

        // Comprobamos que la contraseña actual sea correcta
        if (jefe.password !== currentPass) {
            alert('La contraseña actual no es correcta.');
            return;
        }

        if (!newPass || newPass.length < 4) {
            alert('La nueva contraseña debe tener al menos 4 caracteres.');
            return;
        }

        if (newPass !== repeatPass) {
            alert('Las contraseñas nuevas no coinciden.');
            return;
        }

        jefe.password = newPass;
        localStorage.setItem(email, JSON.stringify(jefe));

        // Limpiamos los campos de contraseña
        if (inputCurrentPass) inputCurrentPass.value = '';
        if (inputNewPass)     inputNewPass.value     = '';
        if (inputRepeatPass)  inputRepeatPass.value  = '';

        alert('Contraseña actualizada correctamente.');
    }

    // =============================
    // SUBIR FOTO DE PERFIL
    // (leemos el archivo como base64 y lo guardamos en localStorage)
    // =============================
    function subirFoto(event) {

        const file = event.target.files[0];
        if (!file) return;

        // Solo permitimos imágenes
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona un archivo de imagen.');
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {

            const base64 = e.target.result;
            const email  = localStorage.getItem('currentUserEmail');

            if (email) {
                localStorage.setItem(`profilePic_${email}`, base64);
            }

            // Actualizamos la previsualización en pantalla
            if (profilePicPreview) {
                profilePicPreview.innerHTML = `<img src="${base64}" alt="Foto de perfil">`;
            }
        };

        reader.readAsDataURL(file);
    }

    // =============================
    // QUITAR FOTO DE PERFIL
    // =============================
    function quitarFoto() {

        const email = localStorage.getItem('currentUserEmail');

        if (email) {
            localStorage.removeItem(`profilePic_${email}`);
        }

        if (profilePicPreview) {
            profilePicPreview.innerHTML = `<i class="fas fa-user"></i>`;
        }
    }

    // =============================
    // EVENTOS PRINCIPALES
    // =============================
    profileForm?.addEventListener('submit', guardarPerfil);
    passwordForm?.addEventListener('submit', cambiarPassword);

    // El botón "Cambiar foto" abre el input file oculto
    btnUploadPic?.addEventListener('click', () => inputPicUpload?.click());
    inputPicUpload?.addEventListener('change', subirFoto);
    btnRemovePic?.addEventListener('click', quitarFoto);

    // =============================
    // INIT
    // =============================
    cargarDatosPerfil();
});
