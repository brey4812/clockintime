import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    // ELEMENTOS DEL DOM
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

    // 1. OBTENER SESIÓN ACTUAL
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = '../login/login.html';
        return;
    }
    const user = session.user;

    // 2. CARGAR DATOS DESDE SUPABASE
    async function cargarPerfil() {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*, roles(nombre_rol)')
            .eq('id', user.id)
            .single();

        if (profile) {
            inputFullname.value = `${profile.nombre} ${profile.apellido}`.trim();
            inputEmail.value = profile.email;
            inputRol.value = profile.roles?.nombre_rol || 'Usuario';
            userNameHeader.textContent = profile.nombre;

            if (profile.avatar_url) {
                profilePicPreview.innerHTML = `<img src="${profile.avatar_url}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            }
        }
    }

    // 3. ACTUALIZAR NOMBRE
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const [nuevoNombre, ...apellidos] = inputFullname.value.split(" ");
        
        const { error } = await supabase
            .from('profiles')
            .update({ 
                nombre: nuevoNombre, 
                apellido: apellidos.join(" ") 
            })
            .eq('id', user.id);

        if (error) alert("Error: " + error.message);
        else alert("Perfil actualizado");
    });

    // 4. SUBIR FOTO A STORAGE
    btnUploadPic.addEventListener('click', () => inputPicUpload.click());

    inputPicUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Subir a la carpeta 'avatars' que creaste en Supabase
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) {
            alert("Error subiendo foto: " + uploadError.message);
            return;
        }

        // Obtener la URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // Guardar URL en la tabla profiles
        await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', user.id);

        location.reload(); // Recargar para ver cambios
    });

    // 5. CAMBIAR CONTRASEÑA (Real)
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPass = document.getElementById('new-password').value;
        const repeatPass = document.getElementById('repeat-password').value;

        if (newPass !== repeatPass) {
            alert("Las contraseñas no coinciden");
            return;
        }

        const { error } = await supabase.auth.updateUser({ password: newPass });

        if (error) alert(error.message);
        else alert("Contraseña actualizada con éxito");
    });

    cargarPerfil();
});