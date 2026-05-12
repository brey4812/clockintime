import { supabase } from './supabase-client.js';

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('btn-login-submit');
const loginForm = document.getElementById('login-form');

// --- Lógica de Temas añadida ---
const themeBtn = document.getElementById('theme-toggle-btn');
const themeIcon = themeBtn?.querySelector('i');

function updateIcon(theme) {
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    updateIcon(currentTheme);
});

themeBtn?.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateIcon(newTheme);
});
// -------------------------------

async function handleLogin(event) {
    event.preventDefault();
    // ... (Tu código de handleLogin original se mantiene igual)
}

loginButton?.addEventListener('click', handleLogin);
loginForm?.addEventListener('submit', handleLogin);
