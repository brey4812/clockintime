// ==========================
// BANNER DE COOKIES clockInTime
// ==========================
window.addEventListener('load', () => {

    const cookieBanner    = document.getElementById('cookie-banner');
    const acceptCookiesBtn = document.getElementById('cookie-accept');
    const rejectCookiesBtn = document.getElementById('cookie-decline');

    // Si no hay banner en esta página (ej. páginas de login), no hacemos nada
    if (!cookieBanner) return;

    /**
     * Determina si se debe mostrar el banner basándose en el localStorage
     * y en la fecha de expiración (30 días).
     */
    function shouldShowBanner() {
        const accepted = localStorage.getItem('cookiesAccepted');
        
        // Si no hay ninguna decisión guardada, mostrar banner
        if (accepted === null) return true;

        // Recuperar la fecha de la decisión (Aceptada o Rechazada)
        const dateKey = accepted === 'true' ? 'cookiesAcceptedDate' : 'cookiesRejectedDate';
        const savedDate = localStorage.getItem(dateKey);

        if (savedDate) {
            const now = Date.now();
            const decisionDate = new Date(savedDate).getTime();
            const diffDays = Math.ceil(Math.abs(now - decisionDate) / (1000 * 60 * 60 * 24));
            
            // Si han pasado más de 30 días, resetear para volver a preguntar
            if (diffDays > 30) {
                localStorage.removeItem('cookiesAccepted');
                localStorage.removeItem('cookiesAcceptedDate');
                localStorage.removeItem('cookiesRejectedDate');
                return true;
            }
        }

        // Si la decisión es reciente (menos de 30 días), no mostrar
        return false;
    }

    // Aplicar visibilidad inicial basada en la lógica anterior
    if (shouldShowBanner()) {
        cookieBanner.style.display = 'flex';
    } else {
        cookieBanner.style.display = 'none';
    }

    // ==========================
    // EVENTO: ACEPTAR COOKIES
    // ==========================
    acceptCookiesBtn?.addEventListener('click', () => {
        localStorage.setItem('cookiesAccepted', 'true');
        localStorage.setItem('cookiesAcceptedDate', new Date().toISOString());
        cookieBanner.style.display = 'none';
        console.log("Cookies aceptadas. Decisión guardada por 30 días.");
    });

    // ==========================
    // EVENTO: RECHAZAR COOKIES
    // ==========================
    rejectCookiesBtn?.addEventListener('click', () => {
        localStorage.setItem('cookiesAccepted', 'false');
        localStorage.setItem('cookiesRejectedDate', new Date().toISOString());
        cookieBanner.style.display = 'none';
        console.log("Cookies rechazadas. Decisión guardada por 30 días.");
    });
});