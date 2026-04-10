//cogemos el los botones de aceptar y rechazar cookies
const acceptCookiesBtn = document.getElementById('cookie-accept');
const rejectCookiesBtn = document.getElementById('cookie-decline');
const cookieBanner = document.getElementById('cookie-banner');


//funcion si se acepta las cookies
acceptCookiesBtn.addEventListener('click', () => {
    // Guardar la preferencia en localStorage y marcar que se han aceptado las cookies y la fecha de aceptación
    localStorage.setItem('cookiesAccepted', 'true');
    localStorage.setItem('cookiesAcceptedDate', new Date().toISOString());
    // Ocultar el banner de cookies
    cookieBanner.style.display = 'none';
});

//funcion si se rechazan las cookies
rejectCookiesBtn.addEventListener('click', () => {
    // Guardar la preferencia en localStorage y marcar que se han rechazado las cookies y la fecha de rechazo
    localStorage.setItem('cookiesAccepted', 'false');
    localStorage.setItem('cookiesRejectedDate', new Date().toISOString());
    // Ocultar el banner de cookies
    cookieBanner.style.display = 'none';
});

//funcion para mostrar el banner de cookies si no se ha tomado una decisión
window.addEventListener('load', () => {
    const cookiesAccepted = localStorage.getItem('cookiesAccepted');
    if (cookiesAccepted === null) {
        cookieBanner.style.display = 'block';
    }
    //si la fecha es mayor a 30 dias se borra la preferencia y se muestra el banner de nuevo
    const cookiesAcceptedDate = localStorage.getItem('cookiesAcceptedDate');
    if (cookiesAcceptedDate) {
        const acceptedDate = new Date(cookiesAcceptedDate);
        const currentDate = new Date();
        const diffTime = Math.abs(currentDate - acceptedDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 30) {
            localStorage.removeItem('cookiesAccepted');
            localStorage.removeItem('cookiesAcceptedDate');
            cookieBanner.style.display = 'block';
        }
    }
    const cookiesRejectedDate = localStorage.getItem('cookiesRejectedDate');
    if (cookiesRejectedDate) {
        const rejectedDate = new Date(cookiesRejectedDate);
        const currentDate = new Date();
        const diffTime = Math.abs(currentDate - rejectedDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 30) {
            localStorage.removeItem('cookiesAccepted');
            localStorage.removeItem('cookiesRejectedDate');
            cookieBanner.style.display = 'block';
        }
    }
});