import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
    const btnRecover = document.getElementById('btn-forgot-submit'); // ID corregido según tu HTML
    const emailInput = document.getElementById('email');
    const forgotForm = document.getElementById('forgot-form');
    const themeBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = themeBtn?.querySelector('i');

    // Lógica de tema
    const updateIcon = (theme) => {
        if (themeIcon) themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    };
    updateIcon(document.documentElement.getAttribute('data-theme'));

    themeBtn?.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateIcon(theme);
    });

    // Lógica de recuperación
    const handleRecovery = async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();

        if (!email) {
            alert('Introduce tu email.');
            return;
        }

        btnRecover.disabled = true;
        btnRecover.textContent = 'Enviando...';

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'https://clockintime.vercel.app/login/reset-password.html',
        });

        if (error) {
            alert('Error: ' + error.message);
            btnRecover.disabled = false;
            btnRecover.textContent = 'Enviar enlace';
        } else {
            alert('¡Enlace enviado! Revisa tu correo.');
            window.location.href = 'login.html';
        }
    };

    forgotForm?.addEventListener('submit', handleRecovery);
    btnRecover?.addEventListener('click', handleRecovery);
});
