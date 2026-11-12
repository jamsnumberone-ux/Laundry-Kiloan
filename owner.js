import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db, auth } from "./firebase-config.js";

// SATPAM: Cek login
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.replace("login.html");
    }
});

// LOGOUT
document.getElementById("btn-logout").addEventListener("click", async () => {
    await signOut(auth);
    window.location.replace("login.html");
});

const transactionsRef = collection(db, "transactions");
const expensesRef = collection(db, "expenses"); // Tabel baru buat pengeluaran

document.addEventListener("DOMContentLoaded", () => {
    loadOwnerData();
});

// LOGIC SIMPAN PENGELUARAN BARU
const formPengeluaran = document.getElementById("form-pengeluaran");
const btnSimpanPengeluaran = document.getElementById("btn-simpan-pengeluaran");

formPengeluaran.addEventListener("submit", async (e) => {
    e.preventDefault();
    btnSimpanPengeluaran.innerText = "Menyimpan...";
    btnSimpanPengeluaran.disabled = true;

    const namaPengeluaran = document.getElementById("nama-pengeluaran").value;
    const nominalPengeluaran = parseFloat(document.getElementById("nominal-pengeluaran").value);

    try {
        await addDoc(expensesRef, {
            nama: namaPengeluaran,
            nominal: nominalPengeluaran,
            tanggal: serverTimestamp()
        });
        alert("Pengeluaran berhasil dicatat!");
        formPengeluaran.reset();
        loadOwnerData(); // Refresh data biar laba bersih langsung ke-update
    } catch (error) {
        alert("Gagal menyimpan pengeluaran: " + error.message);
    } finally {
        btnSimpanPengeluaran.innerText = "Simpan Pengeluaran";
        btnSimpanPengeluaran.disabled = false;
    }
});

// LOGIC LOAD SEMUA DATA & HITUNG LABA BERSIH
async function loadOwnerData() {
    const reportList = document.getElementById("owner-report-list");
    
    try {
        // Ambil data Pemasukan (Transaksi) dan Pengeluaran (Expenses) barengan
        const [transSnapshot, expSnapshot] = await Promise.all([
            getDocs(transactionsRef),
            getDocs(expensesRef)
        ]);

        let omzetHariIni = 0;
        let omzetBulanIni = 0;
        let totalPiutang = 0;
        let pengeluaranBulanIni = 0;

        const todayStr = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        // 1. HITUNG PEMASUKAN DARI TRANSAKSI
        let htmlContent = "";
        
        if (transSnapshot.empty) {
            htmlContent = "<p style='text-align: center; color: #64748b;'>Belum ada pemasukan.</p>";
        } else {
            transSnapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data();
                const totalHarga = Number(data.total) || 0;
                const statusBayar = data.bayar || "Belum Lunas";
                
                let tglTransaksi = new Date();
                if (data.tanggal) {
                    if (typeof data.tanggal.toDate === 'function') tglTransaksi = data.tanggal.toDate();
                    else tglTransaksi = new Date(data.tanggal);
                }

                const tglStr = tglTransaksi.toISOString().split('T')[0];
                
                if (tglStr === todayStr && statusBayar === "Lunas") omzetHariIni += totalHarga;
                if (tglTransaksi.getMonth() === currentMonth && tglTransaksi.getFullYear() === currentYear && statusBayar === "Lunas") omzetBulanIni += totalHarga;
                if (statusBayar === "Belum Lunas") totalPiutang += totalHarga;

                // Format List Pemasukan
                const tanggalFormat = tglTransaksi.toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                const badgeBayarClass = statusBayar === "Lunas" ? "badge-lunas" : "badge-belum";

                htmlContent += `
                    <div class="report-card">
                        <div class="report-info">
                            <h4>${data.nama || "Tanpa Nama"} <span style="font-size:12px; color:#64748b;">(${data.nota})</span></h4>
                            <p>🧺 ${data.layanan} (${data.berat} Kg)</p>
                            <p style="font-size:11px; color:#94a3b8; margin-top:2px;">📅 ${tanggalFormat}</p>
                        </div>
                        <div class="report-right">
                            <span class="price" style="color: #10b981;">+ Rp ${totalHarga.toLocaleString("id-ID")}</span>
                            <span class="mini-badge ${badgeBayarClass}">${statusBayar}</span>
                        </div>
                    </div>
                `;
            });
        }

        // 2. HITUNG PENGELUARAN BULAN INI & CETAK RIWAYATNYA
        let htmlExpense = "";
        
        if (expSnapshot.empty) {
            htmlExpense = "<p style='text-align: center; color: #64748b;'>Belum ada pengeluaran dicatat.</p>";
        } else {
            expSnapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data();
                const nominal = Number(data.nominal) || 0;
                const namaPengeluaran = data.nama || "Pengeluaran Tidak Diketahui";
                
                let tglExp = new Date();
                if (data.tanggal) {
                    if (typeof data.tanggal.toDate === 'function') tglExp = data.tanggal.toDate();
                    else tglExp = new Date(data.tanggal);
                }

                // Kalau pengeluaran terjadi di bulan ini, masuk hitungan
                if (tglExp.getMonth() === currentMonth && tglExp.getFullYear() === currentYear) {
                    pengeluaranBulanIni += nominal;
                }

                // Format List Riwayat Pengeluaran
                const expTanggalFormat = tglExp.toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                htmlExpense += `
                    <div class="report-card">
                        <div class="report-info">
                            <h4>${namaPengeluaran}</h4>
                            <p style="font-size:11px; color:#94a3b8; margin-top:2px;">📅 ${expTanggalFormat}</p>
                        </div>
                        <div class="report-right">
                            <span class="price" style="color: #ef4444;">- Rp ${nominal.toLocaleString("id-ID")}</span>
                        </div>
                    </div>
                `;
            });
        }
        
        // Lempar hasil HTML pengeluaran ke layar
        document.getElementById("expense-report-list").innerHTML = htmlExpense;

        // 3. HITUNG LABA BERSIH
        const labaBersih = omzetBulanIni - pengeluaranBulanIni;

        // Tampilkan ke layar
        document.getElementById("omzet-hari-ini").innerText = `Rp ${omzetHariIni.toLocaleString("id-ID")}`;
        document.getElementById("omzet-bulan-ini").innerText = `Rp ${omzetBulanIni.toLocaleString("id-ID")}`;
        document.getElementById("total-piutang").innerText = `Rp ${totalPiutang.toLocaleString("id-ID")}`;
        document.getElementById("pengeluaran-bulan-ini").innerText = `Rp ${pengeluaranBulanIni.toLocaleString("id-ID")}`;
        document.getElementById("laba-bersih").innerText = `Rp ${labaBersih.toLocaleString("id-ID")}`;
        
        reportList.innerHTML = htmlContent;

    } catch (error) {
        console.error("Error owner:", error);
        reportList.innerHTML = `<p style='text-align: center; color: red;'>Error: ${error.message}</p>`;
    }
}
