import { supabase } from './supabase-client.js';

// --- ELEMENTOS DEL DOM ---
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

// Objeto de estado del usuario
const user = {
    fullname: '',
    email: '',
    password: '',
    company: '',
    companyCode: '',
    boss: false
};

// --- FUNCIONES DE SOPORTE ---

function updateUserFromForm() {
    user.fullname = fullnameInput.value.trim();
    user.email = emailInput.value.trim();
    user.password = passwordInput.value.trim();
    user.company = companyInput.value.trim();
    user.companyCode = companyCodeInput.value.trim();
}

function checkRequiredFields() {
    if (!user.fullname || !user.email || !user.password) {
        alert('Por favor, rellena nombre, email y contraseña.');
        return false;
    }
    return true;
}

function checkUserRole() {
    // Si llena empresa -> Es Jefe. Si llena código -> Es Empleado.
    if (user.company !== '' && user.companyCode === '') {
        user.boss = true;
        return true;
    } else if (user.companyCode !== '' && user.company === '') {
        user.boss = false;
        return true;
    } else {
        alert('Error: Rellena el campo "Empresa" (si eres jefe) O el "Código" (si eres empleado). No ambos.');
        return false;
    }
}

// --- FLUJO PRINCIPAL ---

// PASO 1: Registro en Auth y envío de OTP
async function handleRegistration() {
    updateUserFromForm();
    if (!checkRequiredFields() || !checkUserRole()) return;

    registerButton.disabled = true;
    registerButton.textContent = "Registrando...";

    const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password
    });

    if (error) {
        alert('Error al registrar: ' + error.message);
        registerButton.disabled = false;
        registerButton.textContent = "Iniciar Registro";
        return;
    }

    // Intercambio de secciones
    registerSection.style.display = 'none';
    verifySection.style.display = 'block';
    alert('Código de verificación enviado a ' + user.email);
}

// PASO 2: Verificación del código e inserción de datos
async function handleVerification() {
    const token = verifyTokenInput.value.trim();

    if (!token) {
        alert("Introduce el código de 6 dígitos enviado a tu correo.");
        return;
    }

    verifyButton.disabled = true;
    verifyButton.textContent = "Verificando...";

    const { data: { session }, error: verifyError } = await supabase.auth.verifyOtp({
        email: user.email,
        token: token,
        type: 'signup'
    });

    if (verifyError) {
        alert('Código incorrecto o expirado: ' + verifyError.message);
        verifyButton.disabled = false;
        verifyButton.textContent = "Verificar Código";
        return;
    }

    // Si la verificación es exitosa, creamos el perfil vinculado a la empresa
    await createProfile(session.user.id);
}

// PASO 3: Creación de Empresa y Perfil
async function createProfile(userId) {
    let finalEmpresaId = null;
    let rolId = user.boss ? 1 : 3; // 1: Jefe, 3: Empleado

    try {
        if (user.boss) {
            // CASO JEFE: Creamos la empresa nueva
            const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            
            const { data: newCo, error: coErr } = await supabase
                .from('empresas')
                .insert([{ 
                    nombre: user.company, 
                    codigo_invitacion: generatedCode 
                }])
                .select()
                .single();

            if (coErr) throw coErr;
            finalEmpresaId = newCo.id;
            console.log("Empresa creada con ID:", finalEmpresaId);

        } else {
            // CASO EMPLEADO: Buscamos la empresa por el código introducido
            const { data: coData, error: coSearchErr } = await supabase
                .from('empresas')
                .select('id')
                .eq('codigo_invitacion', user.companyCode)
                .single();

            if (coSearchErr || !coData) {
                throw new Error("El código de empresa no existe. Pídele el código correcto a tu jefe.");
            }
            finalEmpresaId = coData.id;
        }

        // Dividir nombre y apellidos
        const nameParts = user.fullname.split(" ");
        const nombre = nameParts[0];
        const apellido = nameParts.slice(1).join(" ");

        // Insertar en la tabla 'profiles'
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
                id: userId,
                nombre: nombre,
                apellido: apellido || '',
                email: user.email,
                rol_id: rolId,
                empresa_id: finalEmpresaId, // Aquí ya no será NULL
                disponibilidad_id: 3,
                departamento_id: 1
            }]);

        if (profileError) throw profileError;

        alert('¡Registro completado con éxito! Bienvenido a clockInTime.');
        window.location.href = 'login.html';

    } catch (err) {
        console.error("Error en el proceso final:", err);
        alert('Error crítico: ' + err.message);
        verifyButton.disabled = false;
        verifyButton.textContent = "Verificar Código";
    }
}

// --- EVENTOS ---

registerButton.addEventListener('click', (e) => {
    e.preventDefault();
    handleRegistration();
});

verifyButton.addEventListener('click', (e) => {
    e.preventDefault();
    handleVerification();
});