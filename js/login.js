import { supabase } from './supabase-client.js';

// Elementos del DOM
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('btn-login-submit');
const loginForm = document.getElementById('login-form');
const themeBtn = document.getElementById('theme-toggle-btn');
const themeIcon = themeBtn?.querySelector('i');

// --- LÓGICA DE TEMA ---
function updateIcon(theme) {
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Inicializar tema al cargar
document.addEventListener('DOMContentLoaded', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    updateIcon(currentTheme);
});

// Evento para cambiar tema
themeBtn?.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateIcon(newTheme);
});

// --- LÓGICA DE LOGIN ---
async function handleLogin(event) {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        alert('Por favor, introduce tu correo electrónico y contraseña.');
        return;
    }

    try {
        // PASO 1: Iniciar sesión
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) {
            alert('Credenciales incorrectas: ' + authError.message);
            return;
        }

        const user = authData.user;

        // PASO 2: Obtener el perfil y el rol
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('rol_id')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            console.error("Error al obtener perfil:", profileError);
            alert('Perfil no encontrado en la base de datos.');
            return;
        }

        // PASO 3: Redirección lógica por roles
        // 1: Jefe, 2/3: Empleado
        if (profile.rol_id === 1) {
            window.location.href = '../jefes/admin-dashboard.html';
        } else if (profile.rol_id === 2 || profile.rol_id === 3) { 
            window.location.href = '../empleados/dashboard.html';
        } else {
            alert("Tu rol (" + profile.rol_id + ") no tiene una página asignada.");
        }

    } catch (err) {
        console.error("Error crítico:", err);
        alert('Error inesperado.');
    }
}

// Eventos de formulario
loginButton?.addEventListener('click', handleLogin);
loginForm?.addEventListener('submit', handleLogin);
