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
        // Ambil semua data diurutkan dari yang paling baru
        const q = query(transactionsRef, orderBy("tanggal", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            reportList.innerHTML = "<p style='text-align: center; color: #64748b;'>Belum ada data transaksi sama sekali.</p>";
            return;
        }

        let omzetHariIni = 0;
        let omzetBulanIni = 0;
        let totalPiutang = 0;

        // Dapatkan tanggal hari ini format "YYYY-MM-DD" versi lokal atau pembanding sederhana
        const todayStr = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().getMonth(); // 0 - 11
        const currentYear = new Date().getFullYear();

        let htmlContent = "";

        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            const totalHarga = data.total || 0;
            const statusBayar = data.bayar || "Belum Lunas";
            
            // Konversi timestamp firebase ke object Date JavaScript
            let tglTransaksi = new Date();
            if (data.tanggal && data.tanggal.toDate) {
                tglTransaksi = data.tanggal.toDate();
            }

            const tglStr = tglTransaksi.toISOString().split('T')[0];
            const transaksiMonth = tglTransaksi.getMonth();
            const transaksiYear = tglTransaksi.getFullYear();

            // Hitung Omzet Harian (Hanya dihitung jika statusnya LUNAS, atau sesuaikan kebutuhan)
            if (tglStr === todayStr && statusBayar === "Lunas") {
                omzetHariIni += totalHarga;
            }

            // Hitung Omzet Bulanan (Hanya yang LUNAS)
            if (transaksiMonth === currentMonth && transaksiYear === currentYear && statusBayar === "Lunas") {
                omzetBulanIni += totalHarga;
            }

            // Hitung Total Piutang (Yang statusnya Belum Lunas)
            if (statusBayar === "Belum Lunas") {
                totalPiutang += totalHarga;
            }

            // Render ke list HTML
            const badgeBayarClass = statusBayar === "Lunas" ? "badge-lunas" : "badge-belum";
            const tanggalFormat = formatTanggal(tglTransaksi);

            htmlContent += `
                <div class="report-card">
                    <div class="report-info">
                        <h4>${data.nama} <span style="font-size:12px; color:#64748b;">(${data.nota})</span></h4>
                        <p>🧺 ${data.layanan} (${data.berat} Kg) • ${data.status}</p>
                        <p style="font-size:11px; color:#94a3b8; margin-top:2px;">📅 ${tanggalFormat}</p>
                    </div>
                    <div class="report-right">
                        <span class="price">Rp ${totalHarga.toLocaleString("id-ID")}</span>
                        <span class="mini-badge ${badgeBayarClass}">${statusBayar}</span>
                    </div>
                </div>
            `;
        });

        // Masukkan hasil perhitungan ke kotak statistik atas
        elOmzetHari.innerText = `Rp ${omzetHariIni.toLocaleString("id-ID")}`;
        elOmzetBulan.innerText = `Rp ${omzetBulanIni.toLocaleString("id-ID")}`;
        elTotalPiutang.innerText = `Rp ${totalPiutang.toLocaleString("id-ID")}`;

        // Masukkan list laporan ke HTML
        reportList.innerHTML = htmlContent;

    } catch (error) {
        console.error("Gagal memuat data owner:", error);
        reportList.innerHTML = "<p style='text-align: center; color: red;'>Gagal memuat data laporan dari database.</p>";
    }
}

// Helper kecil buat merapikan tanggal
function formatTanggal(date) {
    return date.toLocaleDateString("id-ID", { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

