// 1. Aplicación inmediata del tema (evita destellos blancos)
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

// 2. Función para actualizar el icono en cualquier página
function updateThemeIcon(theme) {
    // Buscamos cualquier icono dentro de un botón de tema
    const icon = document.querySelector('.btn-theme-nav i, .btn-toggle-theme i');
    if (icon) {
        icon.className = (theme === 'dark') ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// 3. Función global para cambiar el tema
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = (currentTheme === 'dark') ? 'light' : 'dark';

    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    updateThemeIcon(newTheme);
}

// 4. Asegurar que el icono sea correcto al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    updateThemeIcon(currentTheme);
});

// 5. Exponer la función al objeto window para que los botones en HTML la vean
window.toggleTheme = toggleTheme;