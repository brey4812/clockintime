import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
    const resetForm = document.getElementById('reset-form');

    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('new-password').value;

        // Cuando el usuario llega desde el correo, Supabase ya tiene 
        // una sesión activa temporal para permitir este cambio.
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            alert("Error al actualizar: " + error.message);
        } else {
            alert("¡Contraseña actualizada con éxito! Ya puedes iniciar sesión.");
            window.location.href = 'login.html';
        }
    });
});