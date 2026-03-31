    import { auth } from "./firebase-config.js";
    import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

    const ADMIN_UIDS = new Set([
    "FWqjOlSz4HOyR7ZDjPCVL6t6iUp2",
    "bFsNvjtDXyZolGITD5KeZnBpE2B3"
    ]);

    const ADMIN_SESSION_KEY = "adminAuthenticated";

    onAuthStateChanged(auth, async (user) => {
    const isAdminValidated = sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";

    if (!user) {
        window.location.replace("index.html");
        return;
    }

    if (!ADMIN_UIDS.has(user.uid)) {
        try {
        await signOut(auth);
        } catch (error) {
        console.warn("No se pudo cerrar sesión de usuario no autorizado:", error);
        }

        sessionStorage.removeItem("adminAuthenticated");
        sessionStorage.removeItem("colaboradorValidated");
        sessionStorage.removeItem("colaboradorFichaId");
        sessionStorage.removeItem("colaboradorEmail");
        sessionStorage.removeItem("colaboradorNombre");

        window.location.replace("index.html");
        return;
    }

    if (!isAdminValidated) {
        try {
        await signOut(auth);
        } catch (error) {
        console.warn("No se pudo cerrar sesión por validación faltante:", error);
        }

        sessionStorage.removeItem("adminAuthenticated");
        window.location.replace("index.html");
    }
    });