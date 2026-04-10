//cogemos los elementos del formulario
//obligatorios o generales (fullname, email, contraseña)
const fullnameInput = document.getElementById('fullname');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const registerButton = document.getElementById('btn-register-submit');

//no obligatorios (company, company-code)
const companyInput = document.getElementById('company');
const companyCodeInput = document.getElementById('company-code');


//objeto de lo que el usuario va a introducir en el formulario
const user = {
    fullname: '',
    email: '',
    password: '',
    company: '',
    companyCode: '',
    boss: false
};


//sincronizamos el objeto user con los valores actuales del formulario
function updateUserFromForm(){

    user.fullname = fullnameInput.value.trim();
    user.email = emailInput.value.trim();
    user.password = passwordInput.value.trim();
    user.company = companyInput.value.trim();
    user.companyCode = companyCodeInput.value.trim();

}


//verificamos que los campos obligatorios estén rellenos
function checkRequiredFields(){

    if(user.fullname === '' || user.email === '' || user.password === ''){
        alert('Por favor rellena todos los campos obligatorios');
        return false;
    }

    return true;

}


//verificamos si el usuario es jefe o empleado
function checkUserRole(){

    if(user.company !== '' && user.companyCode === ''){
        user.boss = true;
        return true;

    }else if(user.companyCode !== '' && user.company === ''){
        user.boss = false;
        return true;

    }else{
        alert('Rellena solo empresa o código de empresa');
        return false;
    }

}


//verificamos que el email sea válido
function checkEmail(){

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if(!emailRegex.test(user.email)){
        alert('Introduce un email válido');
        return false;
    }

    return true;

}


//generamos un codigo aleatorio para empresas
function generateCompanyCode(){

    return Math.random().toString(36).substring(2,8).toUpperCase();

}


//obtenemos las empresas del localStorage
function getCompanies(){

    let companies = JSON.parse(localStorage.getItem('empresas'));

    if(!companies){
        companies = [];
    }

    return companies;

}


//guardamos las empresas en localStorage
function saveCompanies(companies){

    localStorage.setItem('empresas', JSON.stringify(companies));

}


//registrar jefe (crear empresa)
function registerBoss(){

    let companies = getCompanies();

    //comprobamos si la empresa ya existe
    const companyExists = companies.find(c => c.name === user.company);

    if(companyExists){
        alert('La empresa ya existe');
        return false;
    }

    const code = generateCompanyCode();

    const newCompany = {
        name: user.company,
        code: code,
        employees: [user.email]
    };

    companies.push(newCompany);

    saveCompanies(companies);

    user.companyCode = code;

    alert('Tu código de empresa es: ' + code);

    return true;

}


//registrar empleado
function registerEmployee(){

    let companies = getCompanies();

    let companyFound = false;

    for(let company of companies){

        if(company.code === user.companyCode){

            company.employees.push(user.email);

            companyFound = true;

            break;
        }

    }

    if(!companyFound){
        alert('El código de empresa no es válido');
        return false;
    }

    saveCompanies(companies);

    return true;

}


//guardamos el usuario
function saveUser(){

    localStorage.setItem(user.email, JSON.stringify(user));

    console.log(user);

    alert('Usuario registrado correctamente');

    window.location.href = 'login.html';

}


//cuando se envíe el formulario
registerButton.addEventListener('click', function(event){

    event.preventDefault();

    updateUserFromForm();

    if(!checkRequiredFields()) return;

    if(!checkUserRole()) return;

    if(!checkEmail()) return;

    if(user.boss){

        if(!registerBoss()) return;

    }else{

        if(!registerEmployee()) return;

    }

    saveUser();

});