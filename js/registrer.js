import { supabase } from './supabase-client.js';

// Cogemos los elementos del formulario
const fullnameInput = document.getElementById('fullname');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const registerButton = document.getElementById('btn-register-submit');
const companyInput = document.getElementById('company');
const companyCodeInput = document.getElementById('company-code');

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
        alert('Rellena solo empresa (si eres jefe) o código de empresa (si eres empleado)');
        return false;
    }
}

// --- NUEVA LÓGICA DE SUPABASE ---

async function handleRegistration() {
    updateUserFromForm();
    if (!checkRequiredFields() || !checkUserRole()) return;

    // 1. Crear el usuario en la Autenticación de Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password
    });

    if (authError) {
        alert('Error al registrar: ' + authError.message);
        return;
    }

    const userId = authData.user.id;
    let finalEmpresaId = null;
    let rolId = 3; // Por defecto Empleado (según tu tabla roles)

    try {
        if (user.boss) {
            // REGISTRAR JEFE: Crear empresa nueva
            rolId = 1; // Admin
            const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            
            const { data: newCo, error: coErr } = await supabase
                .from('empresas')
                .insert([{ 
                    nombre: user.company, 
                    codigo_invitacion: generatedCode 
                }])
                .select().single();

            if (coErr) throw coErr;
            finalEmpresaId = newCo.id;
            alert('Empresa creada. Tu código para empleados es: ' + generatedCode);
        } else {
            // REGISTRAR EMPLEADO: Buscar empresa por código
            const { data: coData, error: findErr } = await supabase
                .from('empresas')
                .select('id')
                .eq('codigo_invitacion', user.companyCode)
                .single();

            if (!coData) {
                alert('El código de empresa no existe');
                return;
            }
            finalEmpresaId = coData.id;
        }

        // 2. Crear el Perfil en la tabla 'profiles' (la de tu imagen)
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
                disponibilidad_id: 3, // Fuera de jornada
                departamento_id: 1    // General
            }]);

        if (profileError) throw profileError;

        alert('Registro completado. ¡Inicia sesión!');
        window.location.href = 'login.html';

    } catch (err) {
        alert('Error en la base de datos: ' + err.message);
    }
}

// Evento del botón
registerButton.addEventListener('click', function(event) {
    event.preventDefault();
    handleRegistration();
});