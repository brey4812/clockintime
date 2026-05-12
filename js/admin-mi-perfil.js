import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. VERIFICAR SESIÓN
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = '../login/login.html';
        return;
    }

    const formPerfil = document.getElementById('form-mi-perfil');
    const userEmailHeader = document.getElementById('user-name-header');
    const avatarImg = document.getElementById('profile-avatar-preview');
    const inputAvatar = document.getElementById('admin-avatar-file');

    // 2. CARGAR DATOS COMPLETOS (Perfil + Rol + Empresa)
    async function cargarDatosPerfil() {
        const { data: perfil, error } = await supabase
            .from('profiles')
            .select(`
                nombre, 
                apellido,
                email, 
                avatar_url,
                roles(nombre_rol),
                empresas(nombre)
            `)
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error("Error al cargar perfil:", error);
            return;
        }

        if (perfil) {
            // Llenar inputs
            document.getElementById('admin-fullname').value = perfil.nombre || '';
            document.getElementById('admin-lastname').value = perfil.apellido || '';
            document.getElementById('admin-email').value = perfil.email || '';
            
            // Datos informativos (Read-only)
            if(document.getElementById('admin-empresa')) 
                document.getElementById('admin-empresa').value = perfil.empresas?.nombre || 'No asignada';
            if(document.getElementById('admin-rol')) 
                document.getElementById('admin-rol').value = perfil.roles?.nombre_rol || 'Admin';

            // Header y Avatar
            if (userEmailHeader) userEmailHeader.textContent = perfil.nombre;
            if (avatarImg) avatarImg.src = perfil.avatar_url || 'https://iili.io/fzg2rNt.png';
        }
    }

    // 3. GESTIÓN DE SUBIDA DE AVATAR
    inputAvatar?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Subir a Storage (Bucket 'avatars')
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) {
            alert("Error al subir imagen: " + uploadError.message);
            return;
        }

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // Actualizar tabla profiles
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', session.user.id);

        if (updateError) alert("Error al guardar foto: " + updateError.message);
        else {
            avatarImg.src = publicUrl;
            alert("Foto de perfil actualizada");
        }
    });

    // 4. GUARDAR CAMBIOS DE TEXTO
    formPerfil?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const updates = {
            nombre: document.getElementById('admin-fullname').value,
            apellido: document.getElementById('admin-lastname').value,
            updated_at: new Date()
        };

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', session.user.id);

        if (error) {
            alert("Error al actualizar: " + error.message);
        } else {
            alert("¡Perfil actualizado con éxito!");
            if (userEmailHeader) userEmailHeader.textContent = updates.nombre;
        }
    });

    // 5. CERRAR SESIÓN
    document.getElementById('btn-logout-admin')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '../login/login.html';
    });

    cargarDatosPerfil();
});
