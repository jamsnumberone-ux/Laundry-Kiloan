// tracking.js
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "./firebase-config.js"; // Minjem dari config

const btnCek = document.getElementById("btn-cek");
const inputNota = document.getElementById("input-nota");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error-msg");
const resultCard = document.getElementById("result-card");

btnCek.addEventListener("click", cariNota);
inputNota.addEventListener("keypress", (e) => {
    if(e.key === "Enter") cariNota();
});

async function cariNota() {
    const notaValue = inputNota.value.trim().toUpperCase(); 
    if (!notaValue) return alert("Masukkan nomor nota!");

    resultCard.classList.add("hidden");
    errorEl.classList.add("hidden");
    loadingEl.classList.remove("hidden");
    btnCek.disabled = true;

    try {
        const transactionsRef = collection(db, "transactions");
        const q = query(transactionsRef, where("nota", "==", notaValue));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            loadingEl.classList.add("hidden");
            errorEl.classList.remove("hidden");
        } else {
            const data = querySnapshot.docs[0].data();
            tampilkanHasil(data);
        }
    } catch (error) {
        console.error("Error mencari data:", error);
        alert("Gagal terhubung.");
    } finally {
        loadingEl.classList.add("hidden");
        btnCek.disabled = false;
    }
}

function tampilkanHasil(data) {
    document.getElementById("res-nama").innerText = data.nama;
    document.getElementById("res-nota").innerText = data.nota;
    document.getElementById("res-layanan").innerText = `${data.layanan} (${data.berat} Kg)`;
    document.getElementById("res-total").innerText = `Rp ${data.total.toLocaleString("id-ID")}`;

    const statusBadge = document.getElementById("res-status");
    const pesanTambahan = document.getElementById("res-pesan");
    
    statusBadge.className = "status-badge";
    statusBadge.innerText = data.status;

    if (data.status === "Antrean") {
        statusBadge.classList.add("status-antrean");
        pesanTambahan.innerText = "Sabar ya, lagi antre!";
    } else if (data.status === "Diproses") {
        statusBadge.classList.add("status-diproses");
        pesanTambahan.innerText = "Lagi diproses biar wangi!";
    } else if (data.status === "Selesai") {
        statusBadge.classList.add("status-selesai");
        pesanTambahan.innerText = "Yeay! Udah siap diambil.";
    } else if (data.status === "Diambil") {
        statusBadge.classList.add("status-diambil");
        pesanTambahan.innerText = "Terima kasih!";
    }

    resultCard.classList.remove("hidden");
}
