import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    // =============================
    // ELEMENTOS DEL DOM
    // =============================
    const profileForm      = document.getElementById('profile-form');
    const inputNombre      = document.getElementById('fullname');
    const inputEmail       = document.getElementById('email');
    const inputRol         = document.getElementById('role');
    const imgPreview       = document.getElementById('profile-pic-preview');
    const inputUpload      = document.getElementById('input-pic-upload');
    const btnUpload        = document.getElementById('btn-upload-pic');
    const btnRemove        = document.getElementById('btn-remove-pic');
    const userNameHeader   = document.getElementById('user-name-header');

    const passwordForm     = document.getElementById('password-form');
    const inputNewPass     = document.getElementById('new-password');
    const inputRepeatPass  = document.getElementById('repeat-password');

    // =============================
    // 1. CARGA DE DATOS
    // =============================
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return window.location.href = '../login/login.html';

    async function cargarDatos() {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select(`
                nombre, 
                avatar_url,
                roles ( nombre )
            `)
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error("Error cargando perfil:", error.message);
            return;
        }

        // Rellenar campos de texto
        inputNombre.value = profile.nombre;
        inputEmail.value  = session.user.email;
        inputRol.value    = profile.roles?.nombre || 'Empleado';
        
        if (userNameHeader) userNameHeader.textContent = profile.nombre;

        // Renderizar imagen de perfil
        actualizarVistaAvatar(profile.avatar_url);
    }

    function actualizarVistaAvatar(url) {
        if (url) {
            imgPreview.innerHTML = `<img src="${url}" alt="Avatar">`;
        } else {
            imgPreview.innerHTML = `<i class="fas fa-user" style="font-size:3.5rem;color:#94a3b8;"></i>`;
        }
    }

    // =============================
    // 2. ACTUALIZAR NOMBRE
    // =============================
    profileForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nuevoNombre = inputNombre.value.trim();

        const { error } = await supabase
            .from('profiles')
            .update({ nombre: nuevoNombre })
            .eq('id', session.user.id);

        if (error) {
            alert("Error al actualizar: " + error.message);
        } else {
            alert("Perfil actualizado correctamente.");
            if (userNameHeader) userNameHeader.textContent = nuevoNombre;
        }
    });

    // =============================
    // 3. ACTUALIZAR CONTRASEÑA
    // =============================
    passwordForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (inputNewPass.value !== inputRepeatPass.value) {
            alert("Las contraseñas no coinciden.");
            return;
        }

        const { error } = await supabase.auth.updateUser({
            password: inputNewPass.value
        });

        if (error) {
            alert("Error de seguridad: " + error.message);
        } else {
            alert("Contraseña actualizada con éxito.");
            passwordForm.reset();
        }
    });

    // =============================
    // 4. GESTIÓN DE AVATAR (STORAGE)
    // =============================
    btnUpload?.addEventListener('click', () => inputUpload.click());

    inputUpload?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 1. Subir archivo al bucket 'avatars'
        const fileExt = file.name.split('.').pop();
        const filePath = `public/${session.user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) return alert("Error al subir imagen: " + uploadError.message);

        // 2. Obtener URL pública
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

        // 3. Guardar URL en la tabla de perfiles
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', session.user.id);

        if (!updateError) {
            actualizarVistaAvatar(publicUrl);
            alert("Foto de perfil actualizada.");
        }
    });

    btnRemove?.addEventListener('click', async () => {
        if (!confirm("¿Seguro que quieres quitar tu foto de perfil?")) return;

        const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: null })
            .eq('id', session.user.id);

        if (!error) {
            actualizarVistaAvatar(null);
            alert("Foto eliminada.");
        }
    });

    // =============================
    // 5. CERRAR SESIÓN
    // =============================
    document.getElementById('btn-logout')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '../login/login.html';
    });

    cargarDatos();
});
