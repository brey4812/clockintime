// ==========================
// BANNER DE COOKIES
// (con null checks para que no pete en páginas sin banner)
// ==========================
window.addEventListener('load', () => {

    const cookieBanner    = document.getElementById('cookie-banner');
    const acceptCookiesBtn = document.getElementById('cookie-accept');
    const rejectCookiesBtn = document.getElementById('cookie-decline');

    // Si no hay banner en esta página, no hacemos nada
    if (!cookieBanner) return;

    // ==========================
    // MOSTRAR / OCULTAR BANNER
    // (solo si el usuario no ha decidido aún, o han pasado más de 30 días)
    // ==========================
    function shouldShowBanner() {

        const accepted = localStorage.getItem('cookiesAccepted');
        if (accepted === null) return true;

        const dateKey  = accepted === 'true' ? 'cookiesAcceptedDate' : 'cookiesRejectedDate';
        const savedDate = localStorage.getItem(dateKey);

        if (savedDate) {
            const diffDays = Math.ceil(
                Math.abs(Date.now() - new Date(savedDate)) / (1000 * 60 * 60 * 24)
            );
            if (diffDays > 30) {
                // Han pasado más de 30 días, limpiamos y volvemos a preguntar
                localStorage.removeItem('cookiesAccepted');
                localStorage.removeItem('cookiesAcceptedDate');
                localStorage.removeItem('cookiesRejectedDate');
                return true;
            }
        }

        return false;
    }

    if (shouldShowBanner()) {
        cookieBanner.style.display = 'flex';
    } else {
        cookieBanner.style.display = 'none';
    }

    // ==========================
    // ACEPTAR COOKIES
    // ==========================
    acceptCookiesBtn?.addEventListener('click', () => {
        localStorage.setItem('cookiesAccepted', 'true');
        localStorage.setItem('cookiesAcceptedDate', new Date().toISOString());
        cookieBanner.style.display = 'none';
    });

    // ==========================
    // RECHAZAR COOKIES
    // ==========================
    rejectCookiesBtn?.addEventListener('click', () => {
        localStorage.setItem('cookiesAccepted', 'false');
        localStorage.setItem('cookiesRejectedDate', new Date().toISOString());
        cookieBanner.style.display = 'none';
    });
});
