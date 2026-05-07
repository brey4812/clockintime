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
    
    // Elementos para URL externa
    const avatarUrlInput = document.getElementById('avatar-url-input');
    const btnApplyUrl = document.getElementById('btn-apply-url');

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
    // 2. FUNCIÓN PARA MOSTRAR AVATAR (CIRCULAR)
    // =============================
    function renderAvatar(url) {
        if (url) {
            // Creamos la imagen con estilos para que sea siempre circular
            profilePicPreview.innerHTML = `<img src="${url}" alt="Foto" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        } else {
            // Icono por defecto
            profilePicPreview.innerHTML = `<i class="fas fa-user" style="font-size:3rem;color:#94a3b8;"></i>`;
        }
    }

    // =============================
    // 3. CARGAR PERFIL INICIAL
    // =============================
    async function cargarPerfil() {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*, roles(nombre_rol)')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error("Error:", error.message);
            return;
        }

        if (profile) {
            inputFullname.value = `${profile.nombre} ${profile.apellido}`.trim();
            inputEmail.value = profile.email;
            inputRol.value = profile.roles?.nombre_rol || 'Admin';
            userNameHeader.textContent = profile.nombre;
            renderAvatar(profile.avatar_url);
            if (avatarUrlInput) avatarUrlInput.value = profile.avatar_url || '';
        }
    }

    // =============================
    // 4. GUARDAR URL EN BASE DE DATOS
    // =============================
    async function guardarAvatarBD(url) {
        const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: url })
            .eq('id', user.id);

        if (error) {
            alert("Error al guardar: " + error.message);
        } else {
            renderAvatar(url);
            alert("Foto actualizada correctamente.");
        }
    }

    // --- OPCIÓN A: SUBIDA LOCAL (STORAGE) ---
    btnUploadPic?.addEventListener('click', () => inputPicUpload.click());

    inputPicUpload?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileName = `${user.id}-${Date.now()}`;
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file);

        if (uploadError) return alert("Error subiendo: " + uploadError.message);

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        await guardarAvatarBD(publicUrl);
    });

    // --- OPCIÓN B: APLICAR URL EXTERNA ---
    btnApplyUrl?.addEventListener('click', async () => {
        const url = avatarUrlInput.value.trim();
        if (url) {
            await guardarAvatarBD(url);
        } else {
            alert("Pega una URL válida primero.");
        }
    });

    // --- QUITAR FOTO ---
    btnRemovePic?.addEventListener('click', async () => {
        await guardarAvatarBD(null);
        if (avatarUrlInput) avatarUrlInput.value = '';
    });

    // =============================
    // 5. ACTUALIZAR NOMBRE
    // =============================
    profileForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullValue = inputFullname.value.trim();
        const [nuevoNombre, ...apellidos] = fullValue.split(" ");
        
        const { error } = await supabase
            .from('profiles')
            .update({ nombre: nuevoNombre, apellido: apellidos.join(" ") })
            .eq('id', user.id);

        if (error) alert(error.message);
        else {
            userNameHeader.textContent = nuevoNombre;
            alert("Datos actualizados.");
        }
    });

    // =============================
    // 6. CERRAR SESIÓN
    // =============================
    btnLogout?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '../login/login.html';
    });

    cargarPerfil();
});