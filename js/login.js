import { supabase } from './supabase-client.js';

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('btn-login-submit');
const loginForm = document.getElementById('login-form');

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

        // --- DEPURACIÓN: Ver qué rol tiene ---
        console.log("ID de rol detectado:", profile.rol_id);

        // PASO 3: Redirección lógica
        // ¡IMPORTANTE! Revisa en tu tabla 'roles' de Supabase qué ID tiene el empleado.
        // Si el ID de empleado es 2, cambia el 3 por un 2 abajo.
        
        if (profile.rol_id === 1) {
            console.log("Redirigiendo a Jefe...");
            window.location.href = '../jefes/admin-dashboard.html';
        } else if (profile.rol_id === 2 || profile.rol_id === 3) { 
            // He añadido el 2 y el 3 por si acaso
            console.log("Redirigiendo a Empleado...");
            window.location.href = '../empleados/dashboard.html';
        } else {
            alert("Tu rol (" + profile.rol_id + ") no tiene una página asignada.");
        }

    } catch (err) {
        console.error("Error crítico:", err);
        alert('Error inesperado.');
    }
}

// Eventos
loginButton?.addEventListener('click', handleLogin);
loginForm?.addEventListener('submit', handleLogin);