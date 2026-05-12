import { supabase } from './supabase-client.js';

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('btn-login-submit');
const loginForm = document.getElementById('login-form');
const themeBtn = document.getElementById('theme-toggle-btn');
const themeIcon = themeBtn?.querySelector('i');

// Función para actualizar el icono según el tema actual
function updateIcon(theme) {
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Al cargar, aplicamos el icono correcto basado en la persistencia
document.addEventListener('DOMContentLoaded', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    updateIcon(currentTheme);
});

// Cambiar tema y guardar en localStorage para que el index y demás lo sepan
themeBtn?.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateIcon(newTheme);
});

async function handleLogin(event) {
    event.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        alert('Por favor, introduce tu correo electrónico y contraseña.');
        return;
    }

    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) {
            alert('Credenciales incorrectas: ' + authError.message);
            return;
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('rol_id')
            .eq('id', authData.user.id)
            .single();

        if (profileError || !profile) {
            alert('Perfil no encontrado.');
            return;
        }

        if (profile.rol_id === 1) {
            window.location.href = '../jefes/admin-dashboard.html';
        } else {
            window.location.href = '../empleados/dashboard.html';
        }

    } catch (err) {
        console.error("Error crítico:", err);
        alert('Error inesperado.');
    }
}

loginButton?.addEventListener('click', handleLogin);
loginForm?.addEventListener('submit', handleLogin);
