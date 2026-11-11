// app.js
import { collection, addDoc, getDocs, updateDoc, doc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "./firebase-config.js"; // Minjem koneksi dari file sebelah

const transactionsRef = collection(db, "transactions");

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

// Logic Simpan Data
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
            status: "Antrean",
            tanggal: serverTimestamp()
        });
        
        alert(`Berhasil! Total: Rp ${totalHarga.toLocaleString("id-ID")}`);
        document.getElementById("laundry-form").reset();
        btnSimpan.innerText = "Simpan Transaksi";
        navList.click(); 
        
    } catch (error) {
        console.error("Error nambah dokumen: ", error);
        alert("Gagal menyimpan data!");
        btnSimpan.innerText = "Simpan Transaksi";
    }
});

// Logic Ambil Data 
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
            
            let badgeClass = "status-antrean";
            if(data.status === "Diproses") badgeClass = "status-diproses";
            if(data.status === "Selesai") badgeClass = "status-selesai";
            
            if(data.status === "Diambil") return; 
            
            const card = document.createElement("div");
            card.className = "card";
            
            let noWa = data.nohp;
            if (noWa.startsWith("0")) noWa = "62" + noWa.substring(1);
            
            // Link ini udah gua siapin buat web tracking lu nanti
            // (Tinggal ganti URL github lu)
            const pesanSelesai = `Halo Kak ${data.nama},%0A%0ACucian (Nota: *${data.nota}*) sudah *SELESAI* & siap diambil.%0ATagihan: *Rp ${data.total.toLocaleString("id-ID")}*.%0A%0ACek statusmu di: https://github_username_lu.github.io/repo_lu/tracking.html`;
            
            const waButtonHTML = data.status === "Selesai" ? 
                `<a href="https://wa.me/${noWa}?text=${pesanSelesai}" target="_blank" class="btn-wa">📱 WA Pelanggan</a>` : "";

            card.innerHTML = `
                <h4>${data.nama} (${data.nota})</h4>
                <p>📞 ${data.nohp}</p>
                <p>🧺 ${data.layanan} - ${data.berat} Kg</p>
                <p>💰 <b>Rp ${data.total.toLocaleString("id-ID")}</b></p>
                <div class="action-buttons">
                    <span class="status-badge ${badgeClass}" data-id="${id}" data-status="${data.status}">
                        Status: ${data.status}
                    </span>
                    ${waButtonHTML}
                </div>
            `;
            cucianList.appendChild(card);
        });

        document.querySelectorAll(".status-badge").forEach(badge => {
            badge.addEventListener("click", updateStatus);
        });

    } catch (error) {
        console.error("Error ngambil data: ", error);
        cucianList.innerHTML = "<p>Gagal memuat data.</p>";
    }
}

// Logic Update Status 
async function updateStatus(e) {
    const docId = e.target.getAttribute("data-id");
    const currentStatus = e.target.getAttribute("data-status");
    
    let nextStatus = "";
    if(currentStatus === "Antrean") nextStatus = "Diproses";
    else if(currentStatus === "Diproses") nextStatus = "Selesai";
    else if(currentStatus === "Selesai") nextStatus = "Diambil";
    
    if(!nextStatus) return;
    
    const confirmUpdate = confirm(`Ubah status baju jadi "${nextStatus}"?`);
    if(confirmUpdate) {
        try {
            const docRef = doc(db, "transactions", docId);
            await updateDoc(docRef, { status: nextStatus });
            loadData(); 
        } catch (error) {
            console.error("Gagal update status: ", error);
        }
    }
}
