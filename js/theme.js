const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = (currentTheme === 'dark') ? 'light' : 'dark';

    html.setAttribute('data-theme', newTheme);
    
    localStorage.setItem('theme', newTheme);
    
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('.btn-theme-nav i');
    if (icon) {
        if (theme === 'dark') {
            icon.className = 'fas fa-sun'; 
        } else {
            icon.className = 'fas fa-moon'; 
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    updateThemeIcon(theme);
});