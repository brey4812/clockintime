import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. VERIFICAR SESIÓN
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = '../login/login.html';
        return;
    }

    // Elementos del DOM (IDs exactos de tu HTML)
    const formPerfil = document.getElementById('profile-form');
    const userHeader = document.getElementById('user-name-header');
    const imgPreview = document.getElementById('profile-pic-preview');
    const inputFile  = document.getElementById('input-pic-upload');
    const btnUpload  = document.getElementById('btn-upload-pic');
    const btnRemove  = document.getElementById('btn-remove-pic');

    // 2. CARGAR DATOS
    async function cargarDatosPerfil() {
        // Ajustamos la consulta para que coincida con tus tablas reales
        const { data: perfil, error } = await supabase
            .from('profiles')
            .select(`
                nombre, 
                avatar_url,
                rol_id,
                roles(nombre_rol)
            `)
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error("Error al cargar perfil:", error);
            if (userHeader) userHeader.textContent = "Error";
            return;
        }

        if (perfil) {
            // Rellenar inputs del HTML del empleado
            if(document.getElementById('fullname')) 
                document.getElementById('fullname').value = perfil.nombre || '';
            
            if(document.getElementById('email')) 
                document.getElementById('email').value = session.user.email || '';
            
            if(document.getElementById('role')) {
                // Si la relación roles(nombre_rol) funciona, lo usamos, si no, por ID
                document.getElementById('role').value = perfil.roles?.nombre_rol || (perfil.rol_id === 1 ? 'Admin' : 'Empleado');
            }

            // Actualizar Header y Foto
            if (userHeader) userHeader.textContent = perfil.nombre;
            if (perfil.avatar_url && imgPreview) {
                imgPreview.innerHTML = `<img src="${perfil.avatar_url}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            }
        }
    }

    // 3. GESTIÓN DE FOTO (SUBIR)
    btnUpload?.addEventListener('click', () => inputFile.click());

    inputFile?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) {
            alert("Error al subir: " + uploadError.message);
            return;
        }

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', session.user.id);

        if (!updateError) {
            imgPreview.innerHTML = `<img src="${publicUrl}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            alert("Foto actualizada");
        }
    });

    // 4. ELIMINAR FOTO
    btnRemove?.addEventListener('click', async () => {
        const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: null })
            .eq('id', session.user.id);

        if (!error) {
            imgPreview.innerHTML = `<i class="fas fa-user" style="font-size:3.5rem;color:#94a3b8;"></i>`;
            alert("Foto eliminada");
        }
    });

    // 5. GUARDAR CAMBIOS DE NOMBRE
    formPerfil?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nuevoNombre = document.getElementById('fullname').value;

        const { error } = await supabase
            .from('profiles')
            .update({ nombre: nuevoNombre })
            .eq('id', session.user.id);

        if (error) alert("Error: " + error.message);
        else {
            alert("Perfil guardado");
            if (userHeader) userHeader.textContent = nuevoNombre;
        }
    });

    // 6. ACTUALIZAR CONTRASEÑA
    document.getElementById('password-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPass = document.getElementById('new-password').value;
        const repeatPass = document.getElementById('repeat-password').value;

        if (newPass !== repeatPass) {
            alert("Las contraseñas no coinciden");
            return;
        }

        const { error } = await supabase.auth.updateUser({ password: newPass });
        if (error) alert("Error: " + error.message);
        else {
            alert("Contraseña actualizada");
            e.target.reset();
        }
    });

    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '../login/login.html';
    });

    cargarDatosPerfil();
});
