import { supabase } from './supabase-client.js';

// ELEMENTOS DEL DOM
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

// ESTADO DEL USUARIO
const user = {
    fullname: '',
    email: '',
    password: '',
    company: '',
    companyCode: '',
    boss: false
};

// --- LÓGICA DE TEMA ---
function updateIcon(theme) {
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
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
function updateUserFromForm() {
    user.fullname = fullnameInput.value.trim();
    user.email = emailInput.value.trim();
    user.password = passwordInput.value.trim();
    user.company = companyInput.value.trim();
    user.companyCode = companyCodeInput.value.trim();
}

function checkUserRole() {
    if (user.company !== '' && user.companyCode === '') {
        user.boss = true;
        return true;
    } else if (user.companyCode !== '' && user.company === '') {
        user.boss = false;
        return true;
    } else {
        alert('Rellena "Empresa" (Jefe) O el "Código" (Empleado). No ambos.');
        return false;
    }
}

async function handleRegistration() {
    updateUserFromForm();
    if (!fullnameInput.value || !user.email || !user.password) {
        alert('Rellena los campos obligatorios.');
        return;
    }
    if (!checkUserRole()) return;

    registerButton.disabled = true;
    registerButton.textContent = "Registrando...";

    const { error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password
    });

    if (error) {
        alert('Error: ' + error.message);
        registerButton.disabled = false;
        registerButton.textContent = "Crear Cuenta";
        return;
    }

    registerSection.style.display = 'none';
    verifySection.style.display = 'block';
    alert('Código enviado a su email.');
}

async function handleVerification() {
    const token = verifyTokenInput.value.trim();
    if (!token) return;

    verifyButton.disabled = true;
    verifyButton.textContent = "Verificando...";

    const { data: { session }, error } = await supabase.auth.verifyOtp({
        email: user.email,
        token: token,
        type: 'signup'
    });

    if (error) {
        alert('Error: ' + error.message);
        verifyButton.disabled = false;
        return;
    }

    await createProfile(session.user.id);
}

async function createProfile(userId) {
    let finalEmpresaId = null;
    let rolId = user.boss ? 1 : 3;

    try {
        if (user.boss) {
            const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const { data: newCo, error: coErr } = await supabase
                .from('empresas')
                .insert([{ nombre: user.company, codigo_invitacion: generatedCode }])
                .select().single();
            if (coErr) throw coErr;
            finalEmpresaId = newCo.id;
        } else {
            const { data: coData, error: coSearchErr } = await supabase
                .from('empresas')
                .select('id')
                .eq('codigo_invitacion', user.companyCode).single();
            if (coSearchErr) throw new Error("Código de empresa no válido.");
            finalEmpresaId = coData.id;
        }

        const nameParts = user.fullname.split(" ");
        const { error: pErr } = await supabase.from('profiles').insert([{
            id: userId,
            nombre: nameParts[0],
            apellido: nameParts.slice(1).join(" ") || '',
            email: user.email,
            rol_id: rolId,
            empresa_id: finalEmpresaId,
            disponibilidad_id: 3,
            departamento_id: 1
        }]);

        if (pErr) throw pErr;
        alert('¡Registro exitoso!');
        window.location.href = 'login.html';
    } catch (err) {
        alert(err.message);
    }
}

registerButton.addEventListener('click', (e) => { e.preventDefault(); handleRegistration(); });
verifyButton.addEventListener('click', (e) => { e.preventDefault(); handleVerification(); });
