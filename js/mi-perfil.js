import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. VERIFICAR SESIÓN
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = '../login/login.html';
        return;
    }

    // Elementos del DOM
    const userHeader = document.getElementById('user-name-header');
    const imgPreview = document.getElementById('profile-pic-preview');
    const inputFile  = document.getElementById('input-pic-upload');
    
    // Elementos para la URL Externa (NUEVO)
    const urlInput   = document.getElementById('avatar-url-input');
    const btnApplyUrl = document.getElementById('btn-apply-url');

    // 2. CARGAR DATOS
    async function cargarDatosPerfil() {
        const { data: perfil, error } = await supabase
            .from('profiles')
            .select(`
                nombre, 
                avatar_url,
                roles(nombre_rol)
            `)
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error("Error al cargar perfil:", error);
            return;
        }

        if (perfil) {
            if(document.getElementById('fullname')) 
                document.getElementById('fullname').value = perfil.nombre || '';
            
            if(document.getElementById('email')) 
                document.getElementById('email').value = session.user.email || '';
            
            if(document.getElementById('role')) 
                document.getElementById('role').value = perfil.roles?.nombre_rol || 'Empleado';

            if (userHeader) userHeader.textContent = perfil.nombre;
            actualizarVistaFoto(perfil.avatar_url);
        }
    }

    // Función auxiliar para renderizar la foto
    function actualizarVistaFoto(url) {
        if (url && imgPreview) {
            imgPreview.innerHTML = `<img src="${url}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        } else if (imgPreview) {
            imgPreview.innerHTML = `<i class="fas fa-user" style="font-size:3.5rem;color:#94a3b8;"></i>`;
        }
    }

    // 3. APLICAR URL EXTERNA (Igual que en Admin)
    btnApplyUrl?.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (!url) return alert("Por favor, pega una URL válida.");

        const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: url })
            .eq('id', session.user.id);

        if (error) {
            alert(" Error al guardar URL: " + error.message);
        } else {
            actualizarVistaFoto(url);
            alert("Foto actualizada desde URL");
        }
    });

    // 4. SUBIDA LOCAL
    document.getElementById('btn-upload-pic')?.addEventListener('click', () => inputFile.click());

    inputFile?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) return alert("Error al subir: " + uploadError.message);

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

        const { error: updateError } = await supabase
            .from('profiles')
                .update({ avatar_url: publicUrl })
            .eq('id', session.user.id);

        if (!updateError) {
            actualizarVistaFoto(publicUrl);
            alert("Foto local actualizada");
        }
    });

    // 5. QUITAR FOTO
    document.getElementById('btn-remove-pic')?.addEventListener('click', async () => {
        const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: null })
            .eq('id', session.user.id);

        if (!error) {
            actualizarVistaFoto(null);
            if(urlInput) urlInput.value = "";
            alert("Foto eliminada");
        }
    });

    // 6. GUARDAR TEXTO Y SEGURIDAD (Resto del código igual...)
    document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('fullname').value;
        await supabase.from('profiles').update({ nombre }).eq('id', session.user.id);
        if (userHeader) userHeader.textContent = nombre;
        alert("Cambios guardados");
    });

    cargarDatosPerfil();
});
