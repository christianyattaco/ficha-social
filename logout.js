import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD7I29Q12YILYAEyfc2JPnIGn1mr97YDH0",
  authDomain: "ficha-social-427a1.firebaseapp.com",
  projectId: "ficha-social-427a1",
  storageBucket: "ficha-social-427a1.firebasestorage.app",
  messagingSenderId: "793852990137",
  appId: "1:793852990137:web:a084b1e1bad17409dfc168"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {
  const btnLogout = document.getElementById("btnLogout");

  if (!btnLogout) {
    console.warn("No se encontró el botón con id='btnLogout'");
    return;
  }

  btnLogout.addEventListener("click", async (e) => {
    e.preventDefault();

    try {
      sessionStorage.clear();
      await signOut(auth);
      window.location.replace("index.html");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      alert("No se pudo cerrar sesión.");
    }
  });
});
