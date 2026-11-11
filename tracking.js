import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// Perhatikan: Kita import fungsi "where" buat nyari data spesifik
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// TODO: Paste Firebase Config lu di sini (SAMA PERSIS kayak di app.js)
const firebaseConfig = {
    apiKey: "API_KEY_LU",
    authDomain: "PROJECT_LU.firebaseapp.com",
    projectId: "PROJECT_LU",
    storageBucket: "PROJECT_LU.appspot.com",
    messagingSenderId: "MESSAGING_ID",
    appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const btnCek = document.getElementById("btn-cek");
const inputNota = document.getElementById("input-nota");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error-msg");
const resultCard = document.getElementById("result-card");

// Trigger saat tombol ditekan
btnCek.addEventListener("click", cariNota);

// Trigger saat pencet 'Enter' di keyboard HP
inputNota.addEventListener("keypress", (e) => {
    if(e.key === "Enter") cariNota();
});

async function cariNota() {
    const notaValue = inputNota.value.trim().toUpperCase(); // Pastikan huruf besar semua
    
    if (!notaValue) {
        alert("Masukkan nomor nota dulu ya!");
        return;
    }

    // Sembunyikan hasil lama & munculin loading
    resultCard.classList.add("hidden");
    errorEl.classList.add("hidden");
    loadingEl.classList.remove("hidden");
    btnCek.disabled = true;

    try {
        const transactionsRef = collection(db, "transactions");
        // LOGIC PENTING: Cari dokumen di mana field "nota" sama dengan inputan pelanggan
        const q = query(transactionsRef, where("nota", "==", notaValue));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            // Kalau gak ketemu
            loadingEl.classList.add("hidden");
            errorEl.classList.remove("hidden");
        } else {
            // Kalau ketemu, ambil dokumen pertama (karena nota itu unik)
            const data = querySnapshot.docs[0].data();
            tampilkanHasil(data);
        }
    } catch (error) {
        console.error("Error mencari data:", error);
        alert("Gagal koneksi ke server. Coba lagi nanti.");
    } finally {
        // Hilangkan loading
        loadingEl.classList.add("hidden");
        btnCek.disabled = false;
    }
}

function tampilkanHasil(data) {
    // Isi data ke HTML
    document.getElementById("res-nama").innerText = data.nama;
    document.getElementById("res-nota").innerText = data.nota;
    document.getElementById("res-layanan").innerText = `${data.layanan} (${data.berat} Kg)`;
    document.getElementById("res-total").innerText = `Rp ${data.total.toLocaleString("id-ID")}`;

    const statusBadge = document.getElementById("res-status");
    const pesanTambahan = document.getElementById("res-pesan");
    
    // Reset class warna status
    statusBadge.className = "status-badge";
    statusBadge.innerText = data.status;

    // Ganti warna badge dan kasih pesan lucu/ramah berdasarkan status
    if (data.status === "Antrean") {
        statusBadge.classList.add("status-antrean");
        pesanTambahan.innerText = "Baju kamu masih antre nih, sabar ya!";
    } else if (data.status === "Diproses") {
        statusBadge.classList.add("status-diproses");
        pesanTambahan.innerText = "Baju kamu lagi dicuci/disetrika, biar wangi!";
    } else if (data.status === "Selesai") {
        statusBadge.classList.add("status-selesai");
        pesanTambahan.innerText = "Yeay! Cucian udah wangi dan siap diambil.";
    } else if (data.status === "Diambil") {
        statusBadge.classList.add("status-diambil");
        pesanTambahan.innerText = "Terima kasih sudah nyuci di tempat kami!";
    }

    // Tampilkan card
    resultCard.classList.remove("hidden");
}
