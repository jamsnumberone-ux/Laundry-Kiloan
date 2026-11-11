// app.js
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
const errorLog = document.getElementById("error-log"); // Tangkap div error

// Fungsi buat nampilin error di layar
function showError(msg, err) {
    errorLog.style.display = "block";
    errorLog.innerHTML = msg + "<br>Detail: " + (err.message || err);
}

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

form.addEventListener("submit", async (e) => {
    e.preventDefault(); 
    errorLog.style.display = "none"; // Sembunyiin error lama
    
    const btnSimpan = document.getElementById("btn-simpan");
    btnSimpan.innerText = "Menyimpan...";
    btnSimpan.disabled = true; 
    
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
        
        alert(`SUKSES!\nNota: ${notaID}\nTotal: Rp ${totalHarga.toLocaleString("id-ID")}`);
        form.reset(); 
        //navList.click(); 
        
    } catch (error) {
        // INI PENTING: TAMPILIN ERROR KE LAYAR
        showError("Gagal menyimpan data ke Firebase!", error);
    } finally {
        btnSimpan.innerText = "Simpan Transaksi";
        btnSimpan.disabled = false;
    }
});

window.loadData = async function loadData() {
    const cucianList = document.getElementById("cucian-list");
    cucianList.innerHTML = "<p>Loading data...</p>";
    errorLog.style.display = "none"; 
    
    try {
        const q = query(transactionsRef, orderBy("tanggal", "desc"));
        const querySnapshot = await getDocs(q);
        cucianList.innerHTML = "";
        
        if (querySnapshot.empty) {
            cucianList.innerHTML = "<p>Belum ada transaksi.</p>";
            return;
        }

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
            
            const pesanSelesai = `Halo Kak ${data.nama},%0A%0ACucian (Nota: *${data.nota}*) sudah *SELESAI* & siap diambil.%0ATagihan: *Rp ${data.total.toLocaleString("id-ID")}*.%0A%0ACek statusmu di: https://username.github.io/repo/tracking.html`;
            
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
        // INI PENTING: TAMPILIN ERROR KE LAYAR
        cucianList.innerHTML = "<p style='color:red;'>Gagal memuat data.</p>";
        showError("Gagal mengambil data dari Firebase!", error);
    }
}

async function updateStatus(e) {
    const docId = e.target.getAttribute("data-id");
    const currentStatus = e.target.getAttribute("data-status");
    
    let nextStatus = "";
    if(currentStatus === "Antrean") nextStatus = "Diproses";
    else if(currentStatus === "Diproses") nextStatus = "Selesai";
    else if(currentStatus === "Selesai") nextStatus = "Diambil";
    
    if(!nextStatus) return;
    
    if(confirm(`Ubah status baju jadi "${nextStatus}"?`)) {
        try {
            const docRef = doc(db, "transactions", docId);
            await updateDoc(docRef, { status: nextStatus });
            window.loadData(); 
        } catch (error) {
            showError("Gagal update status!", error);
        }
    }
}
