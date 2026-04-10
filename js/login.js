
//pedimos los elementos del DOM
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('btn-login-submit');



//pedimos a localStorage todos los usuarios registrados y los convertimos cada uno en un objeto para compararlos con el usuario que intenta loguearse
function getAllStoredUsers() {
    const users = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (!key || !key.includes('@')) continue;

        try {
            const storedUser = JSON.parse(localStorage.getItem(key));

            if (storedUser && storedUser.email) {
                users.push(storedUser);
            }

        } catch (error) {
            console.warn("Clave ignorada en localStorage:", key);
        }
    }

    return users;
}


// Verificar si el código de empresa es válido
function isCompanyCodeValid(code) {

    const companies = JSON.parse(localStorage.getItem('empresas')) || [];

    return companies.some(company => company.code === code);
}


// Buscar usuario por email o fullname
function findUser(loginValue) {

    const users = getAllStoredUsers();

    return users.find(user =>
        user.email === loginValue ||
        user.fullname === loginValue
    );
}


//Redirigimos al usuario a su dashboard correspondiente según su rol (jefe o empleado) 
function redirectUser(user) {

    if (user.boss) {
        window.location.href = '../jefes/admin-dashboard.html';
    } else {
        window.location.href = '../empleados/dashboard.html';
    }

}


// vemos si el usuario existe y la contraseña es correcta, si es así redirigimos al dashboard correspondiente según su rol (jefe o empleado)
function handleLogin(event) {

    event.preventDefault();

    const loginValue = emailInput.value.trim();
    const password = passwordInput.value;

    // Validar campos vacíos
    if (!loginValue || !password) {
        alert('Por favor introduce usuario y contraseña');
        return;
    }

    const storedUser = findUser(loginValue);

    // Validar usuario y contraseña
    if (!storedUser || storedUser.password !== password) {
        alert('Usuario o contraseña incorrectos');
        return;
    }

    // Validar código de empresa si existe
    if (storedUser.companyCode && !isCompanyCodeValid(storedUser.companyCode)) {
        alert('El código de empresa no es válido');
        return;
    }

    //Reseteamos eñ formulario
    emailInput.value = '';
    passwordInput.value = '';

    // Login correcto
    redirectUser(storedUser);

}


// Agregar evento al botón de login
loginButton.addEventListener('click', handleLogin);