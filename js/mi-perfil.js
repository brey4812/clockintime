import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    // =============================
    // ELEMENTOS DEL DOM
    // =============================
    const profileForm      = document.getElementById('profile-form');
    const inputNombre      = document.getElementById('prof-nombre');
    const inputEmail       = document.getElementById('prof-email'); // Solo lectura
    const inputEmpresa     = document.getElementById('prof-empresa'); // Solo lectura
    const inputRol         = document.getElementById('prof-rol'); // Solo lectura
    const imgPreview       = document.getElementById('profile-img-preview');
    const inputAvatar      = document.getElementById('avatar-upload');
    const userNameHeader   = document.getElementById('user-name-header');

    let userProfile = null;

    // =============================
    // 1. CARGAR DATOS INICIALES
    // =============================
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return window.location.href = '../login/login.html';

    async function cargarDatosPerfil() {
        // Consultamos el perfil con un JOIN para traer el nombre de la empresa y el rol
        const { data: profile, error } = await supabase
            .from('profiles')
            .select(`
                id, 
                nombre, 
                avatar_url,
                empresas ( nombre ),
                roles ( nombre )
            `)
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error("Error cargando perfil:", error.message);
            return;
        }

        userProfile = profile;

        // Rellenar campos
        if (userNameHeader) userNameHeader.textContent = profile.nombre;
        inputNombre.value = profile.nombre;
        inputEmail.value  = session.user.email;
        inputEmpresa.value = profile.empresas?.nombre || 'No asignada';
        inputRol.value     = profile.roles?.nombre || 'Empleado';

        // Cargar avatar si existe
        if (profile.avatar_url) {
            imgPreview.src = profile.avatar_url;
        }
    }

    // =============================
    // 2. ACTUALIZAR PERFIL (NOMBRE)
    // =============================
    profileForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nuevoNombre = inputNombre.value.trim();
        if (!nuevoNombre) return alert("El nombre no puede estar vacío.");

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
    // 3. GESTIÓN DE AVATAR (FOTO)
    // =============================
    inputAvatar?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar que sea imagen
        if (!file.type.startsWith('image/')) return alert("Por favor, sube una imagen.");

        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // 1. Subir al Storage de Supabase (Bucket 'avatars')
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) {
            alert("Error al subir imagen: " + uploadError.message);
            return;
        }

        // 2. Obtener la URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // 3. Guardar la URL en la tabla profiles
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', session.user.id);

        if (!updateError) {
            imgPreview.src = publicUrl;
            alert("Foto de perfil actualizada.");
        }
    });

    // =============================
    // 4. CERRAR SESIÓN
    // =============================
    document.getElementById('btn-logout')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '../login/login.html';
    });

    cargarDatosPerfil();
});
