import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
    const btnRecover = document.getElementById('btn-forgot-submit');
    const emailInput = document.getElementById('email');
    const forgotForm = document.getElementById('forgot-form');
    
    // Elementos para el control de tema
    const themeBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = themeBtn?.querySelector('i');

    // --- FUNCIÓN DE TEMA ---
    const updateIcon = (theme) => {
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    };

    // Al cargar, sincronizamos el icono con el tema que ya viene aplicado desde el HTML
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    updateIcon(currentTheme);

    // Permitir cambiar el tema desde esta página también
    themeBtn?.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme); // Esto es lo que hace que se mantenga en las otras páginas
        updateIcon(theme);
    });

    // --- LÓGICA DE RECUPERACIÓN ---
    const handleRecovery = async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();

        if (!email) {
            alert('Por favor, introduce tu correo electrónico.');
            return;
        }

        btnRecover.disabled = true;
        btnRecover.textContent = 'Enviando enlace...';

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                // Asegúrate de que esta URL esté permitida en tu panel de Supabase
                redirectTo: 'https://clockintime.vercel.app/login/reset-password.html',
            });

            if (error) {
                alert('Error: ' + error.message);
                btnRecover.disabled = false;
                btnRecover.textContent = 'Enviar enlace';
            } else {
                alert('¡Enlace enviado! Revisa tu bandeja de entrada.');
                window.location.href = 'login.html';
            }
        } catch (err) {
            console.error('Error inesperado:', err);
            alert('Ocurrió un error al intentar enviar el correo.');
            btnRecover.disabled = false;
        }
    };

    forgotForm?.addEventListener('submit', handleRecovery);
    btnRecover?.addEventListener('click', handleRecovery);
});
