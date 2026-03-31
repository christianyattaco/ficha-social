  import { auth } from "./firebase-config.js";
  import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

  document.addEventListener("DOMContentLoaded", () => {
    const btnLogout = document.getElementById("btnLogout");

    if (!btnLogout) {
      console.warn("No se encontró #btnLogout en esta página");
      return;
    }

    btnLogout.addEventListener("click", async (e) => {
      e.preventDefault();

      try {
        sessionStorage.removeItem("adminAuthenticated");
        sessionStorage.removeItem("colaboradorValidated");
        sessionStorage.removeItem("colaboradorFichaId");
        sessionStorage.removeItem("colaboradorEmail");
        sessionStorage.removeItem("colaboradorNombre");

        await signOut(auth);
        window.location.replace("index.html");
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
        alert("No se pudo cerrar sesión.");
      }
    });
  });