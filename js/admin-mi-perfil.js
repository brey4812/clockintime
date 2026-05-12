import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const formPerfil = document.getElementById('form-mi-perfil');

    // Cargar datos actuales
    const { data: perfil } = await supabase
        .from('profiles')
        .select('nombre, email')
        .eq('id', session.user.id)
        .single();

    if (perfil) {
        document.getElementById('admin-fullname').value = perfil.nombre;
        document.getElementById('admin-email').value = perfil.email;
    }

    // Guardar cambios
    formPerfil?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nuevoNombre = document.getElementById('admin-fullname').value;

        const { error } = await supabase
            .from('profiles')
            .update({ nombre: nuevoNombre })
            .eq('id', session.user.id);

        if (error) alert("Error al actualizar: " + error.message);
        else alert("Perfil actualizado con éxito");
    });
});
