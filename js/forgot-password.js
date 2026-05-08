import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
    const btnRecover = document.getElementById('btn-recover-submit');
    const emailInput = document.getElementById('recover-email');
    const forgotForm = document.getElementById('forgot-form');

    const handleRecovery = async (e) => {
        e.preventDefault(); // Evitamos que la página se recargue

        const email = emailInput.value.trim();

        if (!email) {
            alert('Por favor, introduce tu correo electrónico.');
            return;
        }

        // Estado visual de carga
        btnRecover.disabled = true;
        btnRecover.textContent = 'Enviando enlace...';

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                // Esta URL debe coincidir con la de Supabase y Vercel
                redirectTo: 'https://clockintime.vercel.app/login/reset-password.html',
            });

            if (error) {
                alert('Error de Supabase: ' + error.message);
                btnRecover.disabled = false;
                btnRecover.textContent = 'Recuperar Contraseña';
            } else {
                alert('¡Enlace enviado! Revisa tu bandeja de entrada (y la carpeta de spam).');
                window.location.href = 'login.html';
            }
        } catch (err) {
            console.error('Error inesperado:', err);
            alert('Ocurrió un error al intentar enviar el correo.');
            btnRecover.disabled = false;
        }
    };

    // Escuchamos tanto el clic como el "Enter" en el formulario
    forgotForm?.addEventListener('submit', handleRecovery);
    btnRecover?.addEventListener('click', handleRecovery);
});