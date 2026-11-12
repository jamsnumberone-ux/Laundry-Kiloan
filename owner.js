import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "./firebase-config.js";

const transactionsRef = collection(db, "transactions");

document.addEventListener("DOMContentLoaded", () => {
    loadOwnerData();
});

async function loadOwnerData() {
    const reportList = document.getElementById("owner-report-list");
    const elOmzetHari = document.getElementById("omzet-hari-ini");
    const elOmzetBulan = document.getElementById("omzet-bulan-ini");
    const elTotalPiutang = document.getElementById("total-piutang");

    try {
        // Tarik data mentah tanpa orderBy dulu buat ngetes koneksi aman
        const querySnapshot = await getDocs(transactionsRef);

        if (querySnapshot.empty) {
            reportList.innerHTML = "<p style='text-align: center; color: #64748b;'>Database kosong, belum ada transaksi.</p>";
            return;
        }

        let omzetHariIni = 0;
        let omzetBulanIni = 0;
        let totalPiutang = 0;

        const todayStr = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        let htmlContent = "";

        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            const totalHarga = Number(data.total) || 0;
            const statusBayar = data.bayar || "Belum Lunas";
            const namaPelanggan = data.nama || "Tanpa Nama";
            const notaID = data.nota || "LND-000";
            const layanan = data.layanan || "Cuci";
            const berat = data.berat || 0;
            const statusCucian = data.status || "Antrean";

            // Handle tanggal dari Firestore (bisa berupa Timestamp atau string)
            let tglTransaksi = new Date();
            if (data.tanggal && typeof data.tanggal.toDate === 'function') {
                tglTransaksi = data.tanggal.toDate();
            }

            const tglStr = tglTransaksi.toISOString().split('T')[0];
            const transaksiMonth = tglTransaksi.getMonth();
            const transaksiYear = tglTransaksi.getFullYear();

            // Hitung Omzet Harian
            if (tglStr === todayStr && statusBayar === "Lunas") {
                omzetHariIni += totalHarga;
            }

            // Hitung Omzet Bulanan
            if (transaksiMonth === currentMonth && transaksiYear === currentYear && statusBayar === "Lunas") {
                omzetBulanIni += totalHarga;
            }

            // Hitung Total Piutang
            if (statusBayar === "Belum Lunas") {
                totalPiutang += totalHarga;
            }

            const badgeBayarClass = statusBayar === "Lunas" ? "badge-lunas" : "badge-belum";
            
            // Format tanggal aman
            const tanggalFormat = tglTransaksi.toLocaleDateString("id-ID", { 
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            htmlContent += `
                <div class="report-card">
                    <div class="report-info">
                        <h4>${namaPelanggan} <span style="font-size:12px; color:#64748b;">(${notaID})</span></h4>
                        <p>🧺 ${layanan} (${berat} Kg) • ${statusCucian}</p>
                        <p style="font-size:11px; color:#94a3b8; margin-top:2px;">📅 ${tanggalFormat}</p>
                    </div>
                    <div class="report-right">
                        <span class="price">Rp ${totalHarga.toLocaleString("id-ID")}</span>
                        <span class="mini-badge ${badgeBayarClass}">${statusBayar}</span>
                    </div>
                </div>
            `;
        });

        elOmzetHari.innerText = `Rp ${omzetHariIni.toLocaleString("id-ID")}`;
        elOmzetBulan.innerText = `Rp ${omzetBulanIni.toLocaleString("id-ID")}`;
        elTotalPiutang.innerText = `Rp ${totalPiutang.toLocaleString("id-ID")}`;

        reportList.innerHTML = htmlContent;

    } catch (error) {
        console.error("Error owner:", error);
        reportList.innerHTML = `<p style='text-align: center; color: red;'>Error: ${error.message}</p>`;
    }
}
