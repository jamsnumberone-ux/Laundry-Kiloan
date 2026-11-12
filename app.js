import { collection, addDoc, getDocs, updateDoc, doc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "./firebase-config.js";

const transactionsRef = collection(db, "transactions");

const hargaLayanan = {
    "Cuci Komplit": 6000,
    "Cuci Kering": 4000,
    "Setrika": 3000
};

const formSection = document.getElementById("form-section");
const listSection = document.getElementById("list-section");
const navForm = document.getElementById("nav-form");
const navList = document.getElementById("nav-list");
const form = document.getElementById("laundry-form");
const errorLog = document.getElementById("error-log");
const searchInput = document.getElementById("search-input");

function showError(msg, err) {
    errorLog.style.display = "block";
    errorLog.innerHTML = msg + "<br>Detail: " + (err.message || err);
}

// LOGIC NAVIGASI
navForm.addEventListener("click", () => {
    formSection.classList.remove("hidden");
    listSection.classList.add("hidden");
    navForm.classList.add("active-nav");
    navList.classList.remove("active-nav");
});

navList.addEventListener("click", () => {
    formSection.classList.add("hidden");
    listSection.classList.remove("hidden");
    navList.classList.add("active-nav");
    navForm.classList.remove("active-nav");
    window.loadData();
});

// LOGIC PENCARIAN (LIVE SEARCH)
searchInput.addEventListener("input", (e) => {
    const keyword = e.target.value.toLowerCase();
    const cards = document.querySelectorAll(".card");
    
    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        // Sembunyiin card yang gak cocok sama ketikan kasir
        if(text.includes(keyword)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
});

// LOGIC SIMPAN TRANSAKSI
form.addEventListener("submit", async (e) => {
    e.preventDefault(); 
    errorLog.style.display = "none";
    
    const btnSimpan = document.getElementById("btn-simpan");
    btnSimpan.innerText = "Menyimpan...";
    btnSimpan.disabled = true; 
    
    const nama = document.getElementById("nama").value;
    const nohp = document.getElementById("nohp").value;
    const layanan = document.getElementById("layanan").value;
    const berat = parseFloat(document.getElementById("berat").value);
    const statusBayar = document.getElementById("status-bayar").value; // Ngambil status bayar
    
    const totalHarga = berat * hargaLayanan[layanan];
    const notaID = "LND-" + Math.floor(1000 + Math.random() * 9000); 

    // Bikin Estimasi Selesai (+3 Hari dari sekarang)
    const dateNow = new Date();
    dateNow.setDate(dateNow.getDate() + 3);
    const estimasiStr = dateNow.toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' });

    try {
        await addDoc(transactionsRef, {
            nota: notaID,
            nama: nama,
            nohp: nohp,
            layanan: layanan,
            berat: berat,
            total: totalHarga,
            status: "Antrean",
            bayar: statusBayar, // Lunas atau Belum Lunas
            estimasi: estimasiStr, // Tanggal selesai
            tanggal: serverTimestamp()
        });
        
        alert(`SUKSES!\nNota: ${notaID}\nEstimasi: ${estimasiStr}\nTotal: Rp ${totalHarga.toLocaleString("id-ID")}`);
        form.reset(); 
        
    } catch (error) {
        showError("Gagal menyimpan data!", error);
    } finally {
        btnSimpan.innerText = "Simpan Transaksi";
        btnSimpan.disabled = false;
    }
});

// LOGIC LOAD DATA
window.loadData = async function loadData() {
    const cucianList = document.getElementById("cucian-list");
    cucianList.innerHTML = "<p style='text-align:center;'>Memuat data...</p>";
    errorLog.style.display = "none"; 
    
    try {
        const q = query(transactionsRef, orderBy("tanggal", "desc"));
        const querySnapshot = await getDocs(q);
        cucianList.innerHTML = "";
        
        if (querySnapshot.empty) {
            cucianList.innerHTML = "<p style='text-align:center;'>Belum ada transaksi.</p>";
            return;
        }

        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            const id = docSnapshot.id;
            
            // Render Status Cucian
            let badgeClass = "status-antrean";
            if(data.status === "Diproses") badgeClass = "status-diproses";
            if(data.status === "Selesai") badgeClass = "status-selesai";
            
            if(data.status === "Diambil") return; // Gak ditampilin di kasir
            
            // Render Status Bayar
            const bayarClass = data.bayar === "Lunas" ? "badge-lunas" : "badge-belum";
            const estimasiText = data.estimasi || "Belum diset";

            const card = document.createElement("div");
            card.className = "card";
            
            let noWa = data.nohp;
            if (noWa.startsWith("0")) noWa = "62" + noWa.substring(1);
            
            const pesanSelesai = `Halo Kak ${data.nama},%0A%0ACucian (Nota: *${data.nota}*) sudah *SELESAI* & siap diambil.%0ATagihan: *Rp ${data.total.toLocaleString("id-ID")}*.%0A%0ACek statusmu di: https://username.github.io/repo/tracking.html`;
            
            const waButtonHTML = data.status === "Selesai" ? 
                `<a href="https://wa.me/${noWa}?text=${pesanSelesai}" target="_blank" class="btn-wa">📱 WA</a>` : "";

            card.innerHTML = `
                <h4>${data.nama} (${data.nota})</h4>
                
                <!-- Badge Lunas/Belum bisa diklik buat update -->
                <span class="badge-bayar ${bayarClass}" data-id="${id}" data-bayar="${data.bayar}">
                    💳 ${data.bayar}
                </span>

                <p>📞 ${data.nohp}</p>
                <p>🧺 ${data.layanan} - ${data.berat} Kg</p>
                <p>💰 <b>Rp ${data.total.toLocaleString("id-ID")}</b></p>
                <p class="estimasi-text">🗓️ Estimasi: ${estimasiText}</p>
                
                <div class="action-buttons">
                    <span class="status-badge ${badgeClass}" data-id="${id}" data-status="${data.status}">
                        Status: ${data.status}
                    </span>
                    ${waButtonHTML}
                </div>
            `;
            cucianList.appendChild(card);
        });

        // Event listener buat tombol status cucian
        document.querySelectorAll(".status-badge").forEach(badge => {
            badge.addEventListener("click", updateStatus);
        });

        // Event listener buat tombol status bayar
        document.querySelectorAll(".badge-bayar").forEach(badge => {
            badge.addEventListener("click", updateBayar);
        });

    } catch (error) {
        cucianList.innerHTML = "<p style='color:red; text-align:center;'>Gagal memuat data.</p>";
        showError("Gagal mengambil data dari Firebase!", error);
    }
}

// LOGIC UPDATE STATUS CUCIAN + OPSI LUNAS OTOMATIS
async function updateStatus(e) {
    const docId = e.target.getAttribute("data-id");
    const currentStatus = e.target.getAttribute("data-status");
    
    let nextStatus = "";
    if(currentStatus === "Antrean") nextStatus = "Diproses";
    else if(currentStatus === "Diproses") nextStatus = "Selesai";
    else if(currentStatus === "Selesai") nextStatus = "Diambil";
    
    if(!nextStatus) return;
    
    // Kalau status mau diubah jadi "Selesai" atau "Diambil", tanyain juga apakah sudah dibayar/lunas
    let updateData = { status: nextStatus };
    
    if (nextStatus === "Selesai" || nextStatus === "Diambil") {
        const bayarLunas = confirm(`Ubah status jadi "${nextStatus}"?\n\nApakah pelanggan juga sudah melunasi pembayaran? (Klik OK jika LUNAS, Cancel jika BELUM)`);
        if (bayarLunas) {
            updateData.bayar = "Lunas";
        }
    } else {
        if(!confirm(`Ubah status cucian jadi "${nextStatus}"?`)) return;
    }

    try {
        const docRef = doc(db, "transactions", docId);
        await updateDoc(docRef, updateData);
        window.loadData(); // Refresh UI instan
    } catch (error) {
        showError("Gagal update status!", error);
    }
}

// LOGIC UPDATE STATUS BAYAR
async function updateBayar(e) {
    const docId = e.target.getAttribute("data-id");
    const currentBayar = e.target.getAttribute("data-bayar");
    
    if(currentBayar === "Lunas") {
        alert("Transaksi ini sudah lunas!");
        return;
    }
    
    if(confirm(`Ubah status pembayaran menjadi LUNAS?`)) {
        try {
            const docRef = doc(db, "transactions", docId);
            await updateDoc(docRef, { bayar: "Lunas" });
            window.loadData(); // Refresh UI instan
        } catch (error) {
            showError("Gagal update pembayaran!", error);
        }
    }
}
