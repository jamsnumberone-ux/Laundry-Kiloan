import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from "./firebase-config.js";

const loginForm = document.getElementById("login-form");
const errorMsg = document.getElementById("error-msg");
const btnLogin = document.getElementById("btn-login");

// Cek kalau udah pernah login, langsung lempar aja biar gak usah login lagi
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (user.email.includes("bos") || user.email.includes("owner")) {
            window.location.href = "owner.html";
        } else {
            window.location.href = "index.html";
        }
    }
});

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.style.display = "none";
    btnLogin.innerText = "Memeriksa...";
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Kalau sukses, otomatis ketangkap sama onAuthStateChanged di atas
    } catch (error) {
        errorMsg.style.display = "block";
        errorMsg.innerText = "Gagal login! Cek email & password.";
        btnLogin.innerText = "Masuk";
    }
});
