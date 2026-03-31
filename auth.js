  import {
    signInWithEmailAndPassword,
    signInAnonymously,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserSessionPersistence
  } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

  import {
    collection,
    query,
    where,
    getDocs,
    limit
  } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

  import { auth, db } from "./firebase-config.js";

  const ADMIN_UIDS = new Set([
    "FWqjOlSz4HOyR7ZDjPCVL6t6iUp2",
    "bFsNvjtDXyZolGITD5KeZnBpE2B3"
  ]);

  const $ = (selector) => document.querySelector(selector);

  const msg = $("#msg");

  // admin
  const adminForm = $("#loginForm");
  const emailEl = $("#email");
  const passEl = $("#password");
  const btnLogin = $("#btnLogin");

  // colaborador
  const workerForm = $("#workerForm");
  const workerEmailEl = $("#workerEmail");
  const workerDniEl = $("#workerDni");
  const btnWorkerLogin = $("#btnWorkerLogin");

  // claves
  const ADMIN_SESSION_KEY = "adminAuthenticated";
  const WORKER_SESSION_KEY = "colaboradorValidated";
  const WORKER_FICHA_KEY = "colaboradorFichaId";
  const WORKER_EMAIL_KEY = "colaboradorEmail";
  const WORKER_NAME_KEY = "colaboradorNombre";

  // banderas internas
  let authReady = false;
  let loginInProgress = false;
  let redirecting = false;

  boot();

  async function boot() {
    try {
      await setPersistence(auth, browserSessionPersistence);
    } catch (error) {
      console.error("No se pudo configurar la persistencia de sesión:", error);
    }

    bindEvents();
    setupAuthWatcher();
  }

  /* =========================
    AUTH WATCHER
  ========================= */
  function setupAuthWatcher() {
    onAuthStateChanged(auth, async (user) => {
      if (!authReady) {
        authReady = true;
        return;
      }

      if (loginInProgress || redirecting) return;

      const isAdminValidated = sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
      const isWorkerValidated = sessionStorage.getItem(WORKER_SESSION_KEY) === "true";
      const colaboradorFichaId = sessionStorage.getItem(WORKER_FICHA_KEY);

      if (!user) return;

      if (ADMIN_UIDS.has(user.uid)) {
        if (isAdminValidated) {
          redirecting = true;
          location.href = "fichas.html";
          return;
        }

        await safeFullSignOut();
        clearAllSessionFlags();
        return;
      }

      if (user.isAnonymous) {
        if (isWorkerValidated && colaboradorFichaId) {
          redirecting = true;
          location.href = `usuarios.html?id=${encodeURIComponent(colaboradorFichaId)}`;
          return;
        }

        await safeFullSignOut();
        clearAllSessionFlags();
      }
    });
  }

  /* =========================
    EVENTOS
  ========================= */
  function bindEvents() {
    adminForm?.addEventListener("submit", handleAdminLogin);
    workerForm?.addEventListener("submit", handleWorkerLogin);

    workerDniEl?.addEventListener("input", () => {
      workerDniEl.value = workerDniEl.value.replace(/\D/g, "").slice(0, 8);
    });
  }

  /* =========================
    LOGIN ADMIN
  ========================= */
  async function handleAdminLogin(e) {
    e.preventDefault();
    clearMsg();

    const email = (emailEl?.value || "").trim().toLowerCase();
    const password = passEl?.value || "";

    if (!email || !password) {
      setMsg("Completa tu correo y contraseña.");
      return;
    }

    setAdminLoading(true);
    loginInProgress = true;

    try {
      clearAllSessionFlags();

      if (auth.currentUser) {
        await safeFullSignOut();
      }

      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      if (!ADMIN_UIDS.has(user.uid)) {
        await safeFullSignOut();
        setMsg("Tu usuario no tiene acceso administrativo.");
        return;
      }

      sessionStorage.setItem(ADMIN_SESSION_KEY, "true");

      redirecting = true;
      location.href = "fichas.html";
    } catch (error) {
      console.error("Error en login admin:", error);
      setMsg(getFirebaseLoginMessage(error));
    } finally {
      loginInProgress = false;
      setAdminLoading(false);
    }
  }

  /* =========================
    LOGIN COLABORADOR
  ========================= */
  async function handleWorkerLogin(e) {
    e.preventDefault();
    clearMsg();

    const email = (workerEmailEl?.value || "").trim().toLowerCase();
    const dni = (workerDniEl?.value || "").trim();

    if (!email || !dni) {
      setMsg("Completa tu correo y tu DNI para continuar.");
      return;
    }

    if (!/^\d{8}$/.test(dni)) {
      setMsg("El DNI debe tener 8 dígitos.");
      return;
    }

    setWorkerLoading(true);
    loginInProgress = true;

    try {
      clearAllSessionFlags();

      if (auth.currentUser) {
        await safeFullSignOut();
      }

      await signInAnonymously(auth);

      const q = query(
        collection(db, "fichas"),
        where("contacto.correo", "==", email),
        limit(20)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        await safeFullSignOut();
        setMsg("No se encontró una ficha asociada a ese correo.");
        return;
      }

      let match = null;

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const correoFicha = String(data?.contacto?.correo || "").trim().toLowerCase();
        const dniFicha = String(data?.personal?.doc || "").trim();

        if (correoFicha === email && dniFicha === dni) {
          match = {
            id: docSnap.id,
            ...data
          };
        }
      });

      if (!match) {
        await safeFullSignOut();
        setMsg("Se encontró el correo, pero el DNI no coincide.");
        return;
      }

      if (match?.meta?.activo === false) {
        await safeFullSignOut();
        setMsg("Tu ficha se encuentra inactiva. Comunícate con Bienestar Social.");
        return;
      }

      sessionStorage.setItem(WORKER_SESSION_KEY, "true");
      sessionStorage.setItem(WORKER_FICHA_KEY, match.id);
      sessionStorage.setItem(WORKER_EMAIL_KEY, email);
      sessionStorage.setItem(
        WORKER_NAME_KEY,
        `${match?.personal?.nombres || ""} ${match?.personal?.apellidos || ""}`.trim()
      );

      redirecting = true;
      location.href = `usuarios.html?id=${encodeURIComponent(match.id)}`;
    } catch (error) {
      console.error("Error en login colaborador:", error);
      await safeFullSignOut();
      clearAllSessionFlags();
      setMsg("No se pudo validar el acceso. Intenta nuevamente.");
    } finally {
      loginInProgress = false;
      setWorkerLoading(false);
    }
  }

  /* =========================
    HELPERS SESIÓN
  ========================= */
  async function safeFullSignOut() {
    try {
      await signOut(auth);
    } catch (error) {
      console.warn("No se pudo cerrar sesión:", error);
    }
  }

  function clearAllSessionFlags() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(WORKER_SESSION_KEY);
    sessionStorage.removeItem(WORKER_FICHA_KEY);
    sessionStorage.removeItem(WORKER_EMAIL_KEY);
    sessionStorage.removeItem(WORKER_NAME_KEY);
  }

  /* =========================
    HELPERS UI
  ========================= */
  function setMsg(text) {
    if (msg) msg.textContent = text || "";
  }

  function clearMsg() {
    setMsg("");
  }

  function setAdminLoading(isLoading) {
    if (!btnLogin) return;

    btnLogin.disabled = isLoading;
    if (emailEl) emailEl.disabled = isLoading;
    if (passEl) passEl.disabled = isLoading;

    btnLogin.textContent = isLoading ? "Validando acceso..." : "Iniciar sesión";
  }

  function setWorkerLoading(isLoading) {
    if (!btnWorkerLogin) return;

    btnWorkerLogin.disabled = isLoading;
    if (workerEmailEl) workerEmailEl.disabled = isLoading;
    if (workerDniEl) workerDniEl.disabled = isLoading;

    btnWorkerLogin.textContent = isLoading ? "Validando..." : "Continuar";
  }

  function getFirebaseLoginMessage(error) {
    const code = error?.code || "";

    switch (code) {
      case "auth/invalid-email":
        return "El correo ingresado no es válido.";
      case "auth/user-disabled":
        return "Esta cuenta ha sido deshabilitada.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Correo o contraseña incorrectos.";
      case "auth/too-many-requests":
        return "Demasiados intentos. Intenta nuevamente en unos minutos.";
      case "auth/network-request-failed":
        return "No se pudo conectar. Verifica tu internet e intenta otra vez.";
      default:
        return "No se pudo iniciar sesión. Verifica tus datos.";
    }
  }