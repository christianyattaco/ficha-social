    import { auth } from "./firebase-config.js";
    import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

    const ADMIN_UIDS = new Set([
    "FWqjOlSz4HOyR7ZDjPCVL6t6iUp2",
    "bFsNvjtDXyZolGITD5KeZnBpE2B3"
    ]);

    const ADMIN_SESSION_KEY = "adminAuthenticated";
    const WORKER_SESSION_KEY = "colaboradorValidated";
    const WORKER_FICHA_KEY = "colaboradorFichaId";

    onAuthStateChanged(auth, async (user) => {
    if (!user) {
        redirectToLogin();
        return;
    }

    const isAdmin = ADMIN_UIDS.has(user.uid);
    const isAdminValidated = sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";

    const isWorkerValidated = sessionStorage.getItem(WORKER_SESSION_KEY) === "true";
    const fichaId = sessionStorage.getItem(WORKER_FICHA_KEY);

    /* ======================
        ADMIN
    ====================== */
    if (isAdmin) {
        if (!isAdminValidated) {
        await forceLogout();
        return;
        }
        return; // OK
    }

    /* ======================
        COLABORADOR
    ====================== */
    if (user.isAnonymous) {
        if (!isWorkerValidated || !fichaId) {
        await forceLogout();
        return;
        }
        return; // OK
    }

    /* ======================
        CUALQUIER OTRO CASO
    ====================== */
    await forceLogout();
    });

    /* ======================
    HELPERS
    ====================== */

    async function forceLogout() {
    try {
        await signOut(auth);
    } catch {}

    clearSession();
    redirectToLogin();
    }

    function clearSession() {
    sessionStorage.removeItem("adminAuthenticated");
    sessionStorage.removeItem("colaboradorValidated");
    sessionStorage.removeItem("colaboradorFichaId");
    sessionStorage.removeItem("colaboradorEmail");
    sessionStorage.removeItem("colaboradorNombre");
    }

    function redirectToLogin() {
    window.location.replace("index.html");
    }