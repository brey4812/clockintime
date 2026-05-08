import { supabase } from './supabase-client.js';

// 1. REFERENCIAS AL DOM
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('btn-login-submit');
const loginForm = document.querySelector('form'); // Por si prefieres capturar el submit del form

/**
 * Función principal de manejo de Login
 */
async function handleLogin(event) {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validación básica inicial
    if (!email || !password) {
        alert('Por favor, introduce tu correo electrónico y contraseña.');
        return;
    }

    try {
        // --- PASO 1: AUTENTICACIÓN CON SUPABASE ---
        // Esto valida el email y password contra la tabla auth.users de Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) {
            // Error típico: "Invalid login credentials" (email o pass incorrectos)
            console.error("Error de Auth:", authError.message);
            alert('Credenciales incorrectas: ' + authError.message);
            return;
        }

        // Si llegamos aquí, el login fue exitoso. 
        // Supabase ya ha guardado el token de sesión en el navegador automáticamente.
        const user = authData.user;

        // --- PASO 2: OBTENER DATOS ADICIONALES (ROL) DEL PERFIL ---
        // Buscamos en nuestra tabla pública 'profiles' para saber si es Jefe o Empleado
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('rol_id')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            console.error("Error al obtener perfil:", profileError);
            alert('Login correcto, pero no se encontró tu perfil de usuario. Contacta con soporte.');
            return;
        }

        // --- PASO 3: LIMPIEZA DE DATOS ANTIGUOS (OPCIONAL) ---
        // Borramos rastro del sistema viejo de localStorage para evitar conflictos
        localStorage.removeItem('currentUserEmail'); 

        // --- PASO 4: REDIRECCIÓN SEGÚN ROL ---
        // Supongamos: rol_id 1 = Admin/Jefe, rol_id 3 = Empleado
        // Ajusta los números según tu tabla 'roles'
        if (profile.rol_id === 1) {
            console.log("Acceso como Administrador/Jefe");
            window.location.href = '../jefes/admin-dashboard.html';
        } else {
            console.log("Acceso como Empleado");
            window.location.href = '../empleados/dashboard.html';
        }

    } catch (err) {
        console.error("Error inesperado:", err);
        alert('Ocurrió un error inesperado durante el inicio de sesión.');
    }
}

// 2. ASIGNACIÓN DE EVENTOS
// Escuchamos el clic en el botón
loginButton?.addEventListener('click', handleLogin);

// También permitimos que funcione al pulsar "Enter" dentro del formulario
loginForm?.addEventListener('submit', handleLogin);