import { supabase } from './supabase-client.js';

// Elementos del DOM
const fullnameInput = document.getElementById('fullname');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const registerButton = document.getElementById('btn-register-submit');
const companyInput = document.getElementById('company');
const companyCodeInput = document.getElementById('company-code');

// Nuevos elementos para la verificación
const registerSection = document.getElementById('register-section');
const verifySection = document.getElementById('verify-section');
const verifyTokenInput = document.getElementById('verify-token');
const verifyButton = document.getElementById('btn-verify-submit');

const user = {
    fullname: '',
    email: '',
    password: '',
    company: '',
    companyCode: '',
    boss: false
};

function updateUserFromForm() {
    user.fullname = fullnameInput.value.trim();
    user.email = emailInput.value.trim();
    user.password = passwordInput.value.trim();
    user.company = companyInput.value.trim();
    user.companyCode = companyCodeInput.value.trim();
}

function checkRequiredFields() {
    if (user.fullname === '' || user.email === '' || user.password === '') {
        alert('Por favor rellena todos los campos obligatorios');
        return false;
    }
    return true;
}

function checkUserRole() {
    if (user.company !== '' && user.companyCode === '') {
        user.boss = true;
        return true;
    } else if (user.companyCode !== '' && user.company === '') {
        user.boss = false;
        return true;
    } else {
        alert('Rellena solo empresa o código de empresa');
        return false;
    }
}

// PASO 1: Lanzar el registro y enviar el código
async function handleRegistration() {
    updateUserFromForm();
    if (!checkRequiredFields() || !checkUserRole()) return;

    const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password
    });

    if (error) {
        alert('Error al registrar: ' + error.message);
        return;
    }

    // Si todo va bien, ocultamos registro y mostramos verificación
    registerSection.style.display = 'none';
    verifySection.style.display = 'block';
    alert('Código enviado a tu email. Por favor, revísalo.');
}

// PASO 2: Verificar el código e insertar en la DB
async function handleVerification() {
    const token = verifyTokenInput.value.trim();

    if (!token) {
        alert("Introduce el código de 6 dígitos.");
        return;
    }

    const { data: { session }, error: verifyError } = await supabase.auth.verifyOtp({
        email: user.email,
        token: token,
        type: 'signup'
    });

    if (verifyError) {
        alert('Código incorrecto: ' + verifyError.message);
        return;
    }

    // Si el código es correcto, ahora sí creamos el perfil en la tabla 'profiles'
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
            const { data: coData } = await supabase
                .from('empresas')
                .select('id').eq('codigo_invitacion', user.companyCode).single();
            finalEmpresaId = coData?.id;
        }

        const [nombre, ...apellidos] = user.fullname.split(" ");
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
                id: userId,
                nombre: nombre,
                apellido: apellidos.join(" ") || '',
                email: user.email,
                rol_id: rolId,
                empresa_id: finalEmpresaId,
                disponibilidad_id: 3,
                departamento_id: 1
            }]);

        if (profileError) throw profileError;

        alert('¡Cuenta verificada y perfil creado correctamente!');
        window.location.href = 'login.html';

    } catch (err) {
        alert('Error al crear el perfil: ' + err.message);
    }
}

// Eventos
registerButton.addEventListener('click', (e) => {
    e.preventDefault();
    handleRegistration();
});

verifyButton.addEventListener('click', (e) => {
    e.preventDefault();
    handleVerification();
});