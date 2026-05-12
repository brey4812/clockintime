import { supabase } from './supabase-client.js';

const fullnameInput = document.getElementById('fullname');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const registerButton = document.getElementById('btn-register-submit');
const companyInput = document.getElementById('company');
const companyCodeInput = document.getElementById('company-code');
const registerSection = document.getElementById('register-section');
const verifySection = document.getElementById('verify-section');
const verifyTokenInput = document.getElementById('verify-token');
const verifyButton = document.getElementById('btn-verify-submit');
const themeBtn = document.getElementById('theme-toggle-btn');
const themeIcon = themeBtn?.querySelector('i');

const user = { fullname: '', email: '', password: '', company: '', companyCode: '', boss: false };

// --- GESTIÓN DE TEMA PERSISTENTE ---
function updateIcon(theme) {
    if (themeIcon) themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

document.addEventListener('DOMContentLoaded', () => {
    updateIcon(document.documentElement.getAttribute('data-theme'));
});

themeBtn?.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateIcon(newTheme);
});

// --- LÓGICA DE REGISTRO ---
async function handleRegistration() {
    user.fullname = fullnameInput.value.trim();
    user.email = emailInput.value.trim();
    user.password = passwordInput.value.trim();
    user.company = companyInput.value.trim();
    user.companyCode = companyCodeInput.value.trim();

    if (!user.fullname || !user.email || !user.password) {
        alert('Rellena los campos obligatorios.');
        return;
    }

    registerButton.disabled = true;
    const { error } = await supabase.auth.signUp({ email: user.email, password: user.password });

    if (error) {
        alert('Error: ' + error.message);
        registerButton.disabled = false;
        return;
    }

    registerSection.style.display = 'none';
    verifySection.style.display = 'block';
}

async function handleVerification() {
    const token = verifyTokenInput.value.trim();
    const { data: { session }, error } = await supabase.auth.verifyOtp({
        email: user.email,
        token: token,
        type: 'signup'
    });

    if (error) {
        alert('Error: ' + error.message);
        return;
    }

    let finalEmpresaId = null;
    let rolId = (user.company !== '') ? 1 : 3;

    if (user.company !== '') {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data: newCo } = await supabase.from('empresas').insert([{ nombre: user.company, codigo_invitacion: code }]).select().single();
        finalEmpresaId = newCo.id;
    } else {
        const { data: coData } = await supabase.from('empresas').select('id').eq('codigo_invitacion', user.companyCode).single();
        finalEmpresaId = coData.id;
    }

    await supabase.from('profiles').insert([{
        id: session.user.id,
        nombre: user.fullname.split(" ")[0],
        apellido: user.fullname.split(" ").slice(1).join(" "),
        email: user.email,
        rol_id: rolId,
        empresa_id: finalEmpresaId,
        disponibilidad_id: 3,
        departamento_id: 1
    }]);

    window.location.href = 'login.html';
}

registerButton.addEventListener('click', (e) => { e.preventDefault(); handleRegistration(); });
verifyButton.addEventListener('click', (e) => { e.preventDefault(); handleVerification(); });
