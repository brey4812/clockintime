import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    // =============================
    // ELEMENTOS DEL DOM
    // =============================
    const userNameHeader = document.getElementById('user-name-header');
    const profileForm = document.getElementById('profile-form');
    const passwordForm = document.getElementById('password-form');
    const inputFullname = document.getElementById('fullname');
    const inputEmail = document.getElementById('email');
    const inputRol = document.getElementById('role');
    const profilePicPreview = document.getElementById('profile-pic-preview');
    const inputPicUpload = document.getElementById('input-pic-upload');
    const btnUploadPic = document.getElementById('btn-upload-pic');
    const btnRemovePic = document.getElementById('btn-remove-pic');
    const btnLogout = document.getElementById('btn-logout');
    const presetAvatars = document.querySelectorAll('.preset-avatar');

    // =============================
    // 1. VERIFICAR SESIÓN
    // =============================
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = '../login/login.html';
        return;
    }
    const user = session.user;

    // =============================
    // 2. CARGAR PERFIL (AL INICIAR)
    // =============================
    async function cargarPerfil() {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*, roles(nombre_rol)')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error("Error cargando perfil:", error.message);
            return;
        }

        if (profile) {
            inputFullname.value = `${profile.nombre} ${profile.apellido}`.trim();
            inputEmail.value = profile.email;
            inputRol.value = profile.roles?.nombre_rol || 'Usuario';
            userNameHeader.textContent = profile.nombre;

            // Mostrar foto si tiene una URL en la base de datos
            if (profile.avatar_url) {
                profilePicPreview.innerHTML = `<img src="${profile.avatar_url}" alt="Foto de perfil">`;
            }
        }
    }

    // =============================
    // 3. GUARDAR DATOS (NOMBRE)
    // =============================
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fullValue = inputFullname.value.trim();
        const [nuevoNombre, ...apellidos] = fullValue.split(" ");
        const nuevoApellido = apellidos.join(" ");

        const { error } = await supabase
            .from('profiles')
            .update({ 
                nombre: nuevoNombre, 
                apellido: nuevoApellido 
            })
            .eq('id', user.id);

        if (error) {
            alert("Error al actualizar: " + error.message);
        } else {
            userNameHeader.textContent = nuevoNombre;
            alert("Perfil actualizado correctamente.");
        }
    });

    // =============================
    // 4. SUBIDA DE FOTO LOCAL (STORAGE)
    // =============================
    btnUploadPic.addEventListener('click', () => inputPicUpload.click());

    inputPicUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar que sea imagen
        if (!file.type.startsWith('image/')) {
            alert("Por favor, selecciona un archivo de imagen válido.");
            return;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`; // Usamos Date.now para evitar cache

        // A. Subir a Supabase Storage (Bucket: 'avatars')
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file);

        if (uploadError) {
            alert("Error al subir imagen: " + uploadError.message);
            return;
        }

        // B. Obtener URL Pública
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        // C. Actualizar campo en tabla profiles
        await actualizarUrlAvatar(publicUrl);
    });

    // =============================
    // 5. SELECCIÓN DE AVATAR RÁPIDO (URL)
    // =============================
    presetAvatars.forEach(avatar => {
        avatar.addEventListener('click', async () => {
            const selectedUrl = avatar.getAttribute('data-url');
            await actualizarUrlAvatar(selectedUrl);
        });
    });

    // Función auxiliar para no repetir código de guardado de URL
    async function actualizarUrlAvatar(url) {
        const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: url })
            .eq('id', user.id);

        if (error) {
            alert("Error al guardar la foto: " + error.message);
        } else {
            profilePicPreview.innerHTML = `<img src="${url}" alt="Foto de perfil">`;
            alert("Foto de perfil actualizada.");
        }
    }

    // =============================
    // 6. QUITAR FOTO
    // =============================
    btnRemovePic.addEventListener('click', async () => {
        const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: null })
            .eq('id', user.id);

        if (!error) {
            profilePicPreview.innerHTML = `<i class="fas fa-user" style="font-size:3rem;color:#94a3b8;"></i>`;
            alert("Foto eliminada.");
        }
    });

    // =============================
    // 7. ACTUALIZAR CONTRASEÑA
    // =============================
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPass = document.getElementById('new-password').value;
        const repeatPass = document.getElementById('repeat-password').value;

        if (newPass.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        if (newPass !== repeatPass) {
            alert("Las contraseñas nuevas no coinciden.");
            return;
        }

        const { error } = await supabase.auth.updateUser({ password: newPass });

        if (error) {
            alert("Error de seguridad: " + error.message);
        } else {
            alert("Contraseña actualizada con éxito.");
            passwordForm.reset();
        }
    });

    // =============================
    // 8. CERRAR SESIÓN
    // =============================
    btnLogout?.addEventListener('click', async (e) => {
        e.preventDefault();
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert("Error al cerrar sesión: " + error.message);
        } else {
            window.location.href = '../login/login.html';
        }
    });

    // Iniciar carga
    cargarPerfil();
});