# Portal Informasi Warga Semidang Alas (RT 003 / RW 002)

Portal Informasi Warga Resmi untuk lingkungan RT 003 / RW 002 Desa Semidang Alas. Aplikasi web statis berkinerja tinggi ini berfungsi sebagai pusat penyampaian pengumuman warga, agenda kegiatan/ronda, serta transparansi laporan kas lingkungan secara publik dan dinamis.

---

## 📸 Fitur Utama

- **Halaman Depan Publik (`index.html`)**:
  - Pengumuman resmi lingkungan dengan tingkat prioritas.
  - Jadwal kegiatan kemasyarakatan & ronda malam.
  - Laporan keuangan kas warga transparan (Pemasukan, Pengeluaran, Saldo Berjalan).
  - Tampilan fully responsive untuk smartphone, tablet, dan desktop.

- **Panel Pengurus (`admin.html`)**:
  - Akses login pengurus terproteksi kata sandi rahasia (`ADMIN_KEY`).
  - Antarmuka tab yang rapi & mudah digunakan oleh siapapun.
  - Pengelolaan penuh (Tambah & Hapus) untuk Pengumuman, Agenda Kegiatan/Ronda, dan Transaksi Kas.

---

## 🛠️ Arsitektur & Teknologi

- **Frontend**: HTML5, CSS3, Tailwind CSS (via CDN), Vanilla JavaScript ES6+.
- **Hosting Frontend**: Cloudflare Pages / GitHub Pages.
- **Backend & API**: Google Apps Script (Web App).
- **Database**: Google Sheets (`Announcements`, `Schedules`, `Finance`).

---

## 🚀 Panduan Serah Terima & Pengoperasian untuk Pengurus

### A. Cara Membuka Portal Warga
Warga desa dapat mengakses portal informasi langsung melalui URL domain Cloudflare Pages dari HP atau komputer masing-masing.

### B. Cara Mengelola Data (Untuk Pengurus)
1. Buka halaman panel pengurus di browser (`https://domain-anda.pages.dev/admin.html`).
2. Masukkan kata sandi rahasia pengurus pada form login.
3. Pilih tab kategori data yang ingin dikelola:
   - **📢 Kelola Pengumuman**
   - **🗓️ Agenda & Ronda**
   - **💰 Transparansi Kas**
4. Isi form yang tersedia dan klik tombol simpan. Data akan langsung diperbarui secara otomatis di halaman publik warga.
