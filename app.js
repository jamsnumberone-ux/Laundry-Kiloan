// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCG_b0ROQpqAoBYOTTH27LoUIf_tCzuAmk",
  authDomain: "laundry-kiloan-aee8f.firebaseapp.com",
  projectId: "laundry-kiloan-aee8f",
  storageBucket: "laundry-kiloan-aee8f.firebasestorage.app",
  messagingSenderId: "476305452999",
  appId: "1:476305452999:web:68109620fe2d79a589f3e2",
  measurementId: "G-0VHZP7LCEH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Harga Master
const hargaLayanan = {
    "Cuci Komplit": 6000,
    "Cuci Kering": 4000,
    "Setrika": 3000
};

// Logic Navigasi Bawah
const formSection = document.getElementById("form-section");
const listSection = document.getElementById("list-section");
const navForm = document.getElementById("nav-form");
const navList = document.getElementById("nav-list");

// Set halaman default pas baru dibuka
listSection.classList.add("hidden");

navForm.addEventListener("click", () => {
    formSection.classList.remove("hidden");
    listSection.classList.add("hidden");
});

navList.addEventListener("click", () => {
    formSection.classList.add("hidden");
    listSection.classList.remove("hidden");
    loadData();
});

// Logic Simpan Data (Create)
document.getElementById("laundry-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btnSimpan = document.getElementById("btn-simpan");
    btnSimpan.innerText = "Menyimpan...";
    
    const nama = document.getElementById("nama").value;
    const nohp = document.getElementById("nohp").value;
    const layanan = document.getElementById("layanan").value;
    const berat = parseFloat(document.getElementById("berat").value);
    
    const totalHarga = berat * hargaLayanan[layanan];
    const notaID = "LND-" + Math.floor(1000 + Math.random() * 9000); 

    try {
        await addDoc(transactionsRef, {
            nota: notaID,
            nama: nama,
            nohp: nohp,
            layanan: layanan,
            berat: berat,
            total: totalHarga,
            status: "Antrean", // Status awal pas baju masuk
            tanggal: serverTimestamp()
        });
        
        alert(`Berhasil! Total: Rp ${totalHarga.toLocaleString("id-ID")}`);
        document.getElementById("laundry-form").reset();
        btnSimpan.innerText = "Simpan Transaksi";
        
        // Pindah otomatis ke tab daftar cucian
        navList.click(); 
        
    } catch (error) {
        console.error("Error nambah dokumen: ", error);
        alert("Gagal menyimpan data!");
        btnSimpan.innerText = "Simpan Transaksi";
    }
});

// Logic Ambil Data (Read) - Ditambah Fitur WhatsApp
async function loadData() {
    const cucianList = document.getElementById("cucian-list");
    cucianList.innerHTML = "<p>Loading data...</p>";
    
    try {
        const q = query(transactionsRef, orderBy("tanggal", "desc"));
        const querySnapshot = await getDocs(q);
        cucianList.innerHTML = "";
        
        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            const id = docSnapshot.id;
            
            // Render warna dan teks berdasarkan status
            let badgeClass = "status-antrean";
            if(data.status === "Diproses") badgeClass = "status-diproses";
            if(data.status === "Selesai") badgeClass = "status-selesai";
            
            // Sembunyikan kalau udah "Diambil"
            if(data.status === "Diambil") return; 
            
            const card = document.createElement("div");
            card.className = "card";
            
            // Format format WA - Ganti spasi dengan %20 dan enter dengan %0A (URL Encoding)
            const pesanSelesai = `Halo Kak ${data.nama},%0A%0ACucian dari nota *${data.nota}* sudah *SELESAI* dan siap diambil ya.%0ATotal tagihan: *Rp ${data.total.toLocaleString("id-ID")}*.%0A%0ATerima kasih sudah laundry di tempat kami!`;
            
            // Pastikan nomor HP formatnya benar buat WA API (ubah 08 jadi 628)
            let noWa = data.nohp;
            if (noWa.startsWith("0")) {
                noWa = "6289535578298" + noWa.substring(1);
            }
            
            // Tombol WA hanya muncul kalau status "Selesai"
            const waButtonHTML = data.status === "Selesai" ? 
                `<a href="https://wa.me/${noWa}?text=${pesanSelesai}" target="_blank" class="btn-wa">📱 Kirim Notif WA</a>` : "";

            card.innerHTML = `
                <h4>${data.nama} (${data.nota})</h4>
                <p>📞 ${data.nohp}</p>
                <p>🧺 ${data.layanan} - ${data.berat} Kg</p>
                <p>💰 <b>Rp ${data.total.toLocaleString("id-ID")}</b></p>
                <div class="action-buttons">
                    <span class="status-badge ${badgeClass}" data-id="${id}" data-status="${data.status}">
                        Status: ${data.status} (Tap ubah)
                    </span>
                    ${waButtonHTML}
                </div>
            `;
            cucianList.appendChild(card);
        });

        // Binding event listener buat fungsi klik update status
        document.querySelectorAll(".status-badge").forEach(badge => {
            badge.addEventListener("click", updateStatus);
        });

    } catch (error) {
        console.error("Error ngambil data: ", error);
        cucianList.innerHTML = "<p>Gagal memuat data. Cek Rules Firestore lu.</p>";
    }
}

// Logic Update Status (Update)
async function updateStatus(e) {
    const docId = e.target.getAttribute("data-id");
    const currentStatus = e.target.getAttribute("data-status");
    
    // Alur kasir laundry
    let nextStatus = "";
    if(currentStatus === "Antrean") nextStatus = "Diproses";
    else if(currentStatus === "Diproses") nextStatus = "Selesai";
    else if(currentStatus === "Selesai") nextStatus = "Diambil";
    
    if(!nextStatus) return;
    
    const confirmUpdate = confirm(`Ubah status baju dari "${currentStatus}" menjadi "${nextStatus}"?`);
    if(confirmUpdate) {
        try {
            const docRef = doc(db, "transactions", docId);
            await updateDoc(docRef, {
                status: nextStatus
            });
            loadData(); // Refresh UI instan
        } catch (error) {
            console.error("Gagal update status: ", error);
        }
    }
}
