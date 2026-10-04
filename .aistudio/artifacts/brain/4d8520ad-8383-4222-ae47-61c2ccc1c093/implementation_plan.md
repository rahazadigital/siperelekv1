# Sistem Manajemen Keuangan Warga Multi-RT / RW (SiPerelek RW)

Aplikasi Web & Progressive Web App (PWA) modern untuk transparansi keuangan kas dan iuran bulanan warga lintas rukun tetangga (multi-RT) dengan pengawasan terpadu tingkat rukun warga (RW). Mengintegrasikan Google Sheets sebagai basis data real-time via Google Apps Script (GAS) dan backend Express proxy yang mendukung mode offline.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Berdasarkan sesi klarifikasi pada Tahap 1, keputusan arsitektur berikut telah disepakati:
> 1. **Struktur Data Google Sheets**: Menggunakan **Sheet Tab Terpisah untuk Masing-Masing RT** (contoh: `TX_RT001`, `TX_RT002`, `TX_RT003`) ditambah sheet master `PENGATURAN_RW`, `PENGGUNA`, `REFERENSI`, dan `LOG_AKTIVITAS` untuk tata kelola yang rapi dan terisolasi.
> 2. **Akses Warga**: Warga memilih unit RT mereka, lalu memasukkan **6-Digit PIN Akses Warga RT** tersebut untuk membuka laporan kas & iuran secara langsung tanpa perlu pendaftaran akun perorangan.
> 3. **Komunikasi & Offline PWA**: Menggunakan **Express Server Proxy (`/api/*`)** yang menghubungkan aplikasi web ke Google Apps Script Web App (`https://script.google.com/macros/s/AKfycbyuqCOkwnYHAtcTvLkCG90MojoP9_-YqH7WWobnDEtYkFoaXoi46xQSEs8JNu5Ef9qv/exec`), menangani CORS, menyimpan cache lokal (IndexedDB / localStorage) untuk mode offline, dan mengaktifkan PWA Service Worker.

---

## 1. Overview & Core Concept

### Apa yang Dibangun
Platform keuangan lingkungan terpadu yang memadukan transparansi publik bagi warga dengan keamanan administratif bertingkat (Role-Based Access Control):
- **Warga**: Memilih nomor RT dan memasukkan PIN 6-digit untuk memantau saldo kas berjalan, rincian pemasukan/pengeluaran, iuran bulanan, dan mencetak laporan keuangan RT mereka secara real-time.
- **Bendahara / Pengurus RT**: Mengelola (CRUD: Tambah, Ubah, Batalkan) transaksi kas hanya pada RT masing-masing. Terkunci secara ketat agar tidak dapat melihat atau mengubah data RT lain.
- **Ketua / Pengurus RW**: Memantau dashboard agregat seluruh RT se-RW (komparasi saldo, total kas RW, grafik pemasukan/pengeluaran antar-RT, audit laporan) dengan mode *read-only*.
- **Administrator Sistem**: Memiliki hak akses penuh (*Super Admin*) untuk CRUD transaksi seluruh RT, mengatur daftar RT, mengelola akun pengurus, kategori referensi kas, lisensi, dan log aktivitas audit.

### Target Pengguna
1. **Warga Lingkungan** (akses cepat lewat HP/browser, tampilan intuitif, ramah lansia/keluarga).
2. **Bendahara & Ketua RT** (pencatatan transaksi kas harian/bulanan via HP atau laptop).
3. **Pengurus RW** (pengawasan transparansi kas seluruh RT untuk musyawarah RW).
4. **Admin IT / RW** (pengelolaan sistem, akun pengurus, dan pemeliharaan data spreadsheet).

---

## 2. User Experience & Visual Design

### A. Alur Pengguna (User Flows)
1. **Gerbang Masuk Warga (Pilih RT + PIN Lock)**:
   - Pengguna pertama kali disambut layar pemilihan RT (misal RT 01 s/d RT 10).
   - Muncul Keypad PIN 6 digit yang elegan untuk memverifikasi keamanan warga lingkungan RT tersebut.
   - Setelah PIN valid, token akses warga tersimpan di browser (opsional "Ingat PIN") dan langsung diarahkan ke Dashboard RT.
2. **Dashboard Keuangan RT (Mode Warga)**:
   - **Kartu Hero Saldo Kas**: Menampilkan saldo terkini, periode bulan/tahun, tombol privasi saldo (`Rp ••••••`), tombol unduh/cetak laporan, dan status sinkronisasi.
   - **4 Kartu Ringkasan (KPI)**: Saldo Awal, Pemasukan Bulan Ini, Pengeluaran Bulan Ini, dan Saldo Akhir.
   - **Daftar & Riwayat Transaksi**: Dilengkapi filter kejadian (Iuran, Sampah, Kematian, Bencana, Sosial), pencarian teks instan, dan badge kategori.
3. **Dashboard Konsolidasi RW (Mode RW)**:
   - **Ringkasan Total Kas RW**: Agregasi saldo dari semua RT se-RW.
   - **Tabel Komparasi Saldo Antar-RT**: Memperlihatkan saldo masing-masing RT, keaktifan transaksi bulan ini, dan saldo rata-rata.
   - **Pemilih RT**: Memungkinkan Pengurus RW beralih melihat rincian transaksi RT tertentu tanpa hak mengedit.
4. **Portal Pengurus (Bendahara & Admin)**:
   - Form pencatatan transaksi kas baru dengan validasi otomatis (nominal, jenis transaksi, tanggal, kategori).
   - Validasi saldo negatif (peringatan jika pengeluaran melebihi kas).
   - Modal pembatalan transaksi dengan kewajiban mengisi alasan pembatalan (audit trail).
   - Panel Kelola Pengguna, Kelola Referensi Kategori Kas, Pengaturan Saldo Awal per RT, dan Log Aktivitas (Admin).

### B. Visual Identity & Design System
- **Identitas Visual**: Berlandaskan ikon resmi `rtrw.png` ("IURAN RT / RW") bernuansa biru terpercaya, hijau daun kemakmuran, dan aksen emas transparansi kas.
- **Tipografi**:
   - Judul & Display: Font geometris tegas dan ramah (`Plus Jakarta Sans` / modern sans-serif).
   - Angka & Moneter: Selalu menggunakan **Tabular Numerals** (`tabular-nums` atau `font-mono`) agar posisi desimal dan digit nominal tersusun rapi tanpa pergeseran layout.
- **Warna & Palet (Tailwind)**:
   - *Dominan Latar*: Slate lembut (`bg-slate-50` / `bg-[#f8fafc]`) dengan aksen glassmorphism halus (`backdrop-blur-md bg-white/85`).
   - *Identitas Primer*: Emerald Green (`#059669` / `#047857`) untuk saldo positif & pemasukan, Slate Blue (`#1e40af` / `#2563eb`) untuk panel RW & navigasi utama.
   - *Peringatan & Pengeluaran*: Rose Red (`#dc2626` / `#ef4444`) untuk pengeluaran kas dan pembatalan.
   - *Aksen Khusus*: Amber Gold (`#d97706` / `#f59e0b`) untuk iuran penting dan lisensi/status.
- **Ergonomi Sentuhan & PWA Mobile**:
   - Target sentuhan minimal $44 \times 44\text{px}$ pada tombol keypad PIN, filter tab, dan tombol aksi.
   - Bottom Sheet ergonomis untuk form input transaksi di perangkat ponsel.
   - Spanduk instalasi PWA (*In-App Install Prompt*) yang elegan dan instruksi khusus iOS Safari.

---

## 3. Key Product Decisions & Trade-Offs

### Keputusan 1: Tab Spreadsheet Terpisah per RT vs Sheet Gabungan
- **Pilihan**: Sheet Tab Terpisah untuk Masing-Masing RT (misal `TX_RT001`, `TX_RT002`, dst.) dengan sheet master konsolidasi.
- **Alasan**: Memberikan isolasi data yang sangat jelas bagi bendahara jika pengurus membuka Spreadsheet Google secara langsung, mempermudah backup/arsip tahunan per RT, dan mencegah kesalahan baris data yang tertimpa antar-RT.
- **Kompensasi**: Backend GAS / Express menyediakan fungsi agregasi otomatis (`getLaporanRW`) yang membaca ringkasan saldo dari seluruh tab RT dalam satu pemanggilan API yang efisien.

### Keputusan 2: Role-Based Access Control (RBAC) Multitingkat
- **Matriks Akses**:
  | Peran (Role) | Akses Data RT Sendiri | Akses Data RT Lain | CRUD Transaksi | Kelola User & Pengaturan |
  | :--- | :---: | :---: | :---: | :---: |
  | **WARGA** | Lihat (Read-Only via PIN) | Tidak Bisa | Tidak Bisa | Tidak Bisa |
  | **BENDAHARA / RT** | Lihat & CRUD | Tidak Bisa | Ya (Hanya RT-nya) | Saldo Awal RT-nya & PIN Warga RT-nya |
  | **RW** | Lihat Semua RT | Ya (Read-Only Seluruh RT) | Tidak Bisa | Tidak Bisa |
  | **ADMIN** | Lihat Semua RT | Ya (Full Access) | Ya (Seluruh RT) | Ya (Penuh) |
- **Penegakan di Tingkat API/Database**: Server proxy Express & Google Apps Script memvalidasi token sesi dan payload RT sebelum menjalankan operasi. Jika peran `RT` mencoba mengubah tab RT lain, sistem langsung menolak dengan kode kesalahan otorisasi.

### Keputusan 3: Arsitektur Proxy Express + PWA Offline Support
- **Pilihan**: Menggunakan Express.js server yang terpasang di runtime Node.js untuk melayani frontend Vite + proxy API endpoint (`/api/*`) menuju Google Apps Script.
- **Alasan**: Menghindari masalah CORS browser, menyembunyikan payload rahasia, menyediakan caching respon data kas, dan memungkinkan aplikasi bekerja secara instan bahkan ketika koneksi internet lingkungan sedang lambat.

---

## 4. Technical Architecture & Data Strategy

### A. Diagram Arsitektur Sistem

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KLIEN (BROWSER / PWA)                           │
│  ┌──────────────────────┐  ┌────────────────────┐  ┌────────────────┐  │
│  │ Dashboard Warga (PIN)│  │ Panel Bendahara RT │  │ Monitoring RW  │  │
│  └──────────┬───────────┘  └─────────┬──────────┘  └────────┬───────┘  │
│             │                        │                      │          │
│             └────────────────────────┼──────────────────────┘          │
│                                      │                                 │
│                         Service Worker & LocalCache                    │
└──────────────────────────────────────┬─────────────────────────────────┘
                                       │ HTTP / Fetch (/api/*)
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   EXPRESS BACKEND PROXY (PORT 3000)                    │
│  • RBAC Token & PIN Validator (Validasi hak akses per RT)              │
│  • Cache Manager (Meminimalisir quota Google Apps Script)               │
│  • Endpoint Proxy (/api/login, /api/laporan, /api/transaksi, dll.)      │
└──────────────────────────────────────┬─────────────────────────────────┘
                                       │ HTTPS POST / JSON
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│              GOOGLE APPS SCRIPT WEB APP (Spreadsheet DB)               │
│  • API Dispatcher (doPost / doGet)                                     │
│  • LockService (Mencegah race-condition input kas)                     │
│  • Multi-Tab Spreadsheet Router                                        │
└──────────────────────────────────────┬─────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       GOOGLE SPREADSHEET DATABASE                      │
│  [PENGATURAN_RW]  [PENGGUNA]  [REFERENSI]  [LOG_AKTIVITAS]             │
│  [TX_RT001]       [TX_RT002]  [TX_RT003]   [TX_RT004] ...              │
└────────────────────────────────────────────────────────────────────────┘
```

### B. Struktur Data Google Sheets

1. **Sheet `PENGATURAN_RW`**:
   - Kolom: `key`, `value`
   - Data: `nama_rw` (contoh: "RW 009"), `daftar_rt` ("001,002,003,004"), `nama_aplikasi`, `wa_admin`, `pin_warga_RT001`, `pin_warga_RT002`, dst., `saldo_awal_RT001`, `saldo_awal_RT002`, dst.
2. **Sheet `PENGGUNA`**:
   - Kolom: `username`, `nama`, `peran` (`ADMIN`, `RW`, `BENDAHARA`, `RT`), `rt_id` (`ALL` untuk Admin & RW, atau kode RT misal `001`), `password`, `aktif`.
3. **Sheet `TX_RT{kode}`** (Misal `TX_RT001`, `TX_RT002`):
   - Kolom: `id_transaksi`, `tanggal`, `jenis_transaksi` (PEMASUKAN / PENGELUARAN), `jenis_kejadian`, `nominal`, `keterangan`, `status` (AKTIF / DIBATALKAN), `dibuat_oleh`, `dibuat_pada`, `diubah_oleh`, `diubah_pada`.
4. **Sheet `REFERENSI`**:
   - Kolom: `jenis_kejadian`, `jenis_transaksi_diizinkan`, `aktif`.
5. **Sheet `LOG_AKTIVITAS`**:
   - Kolom: `waktu`, `username`, `rt_id`, `aksi`, `id_transaksi`, `detail`.

### C. Script Google Apps Script yang Disempurnakan
Menyediakan kode backend GAS lengkap untuk diunduh / disalin pengguna yang mencakup:
- Inisialisasi otomatis tab RT (`setupDatabaseMultiRT`).
- Handler `doPost(e)` dan `doGet(e)` dengan output JSON terstruktur.
- Proteksi mutasi data berbasis `rt_id` sesuai token login pengguna.

---

## 5. Rencana Tahap Implementasi (Execution Roadmap)

1. **Setup Aset, Metadata & Dependensi**:
   - Memasang aset logo `rtrw.png` ke folder `public/` dan mengonfigurasi ikon PWA (192x192, 512x512, apple-touch-icon).
   - Memperbarui `index.html` dan `metadata.json` sesuai nama aplikasi "SiPerelek Multi-RT/RW".
   - Memastikan server Express dan plugin PWA berjalan lancar.
2. **Backend Server Express Proxy (`server.ts`)**:
   - Membuat rute proxy API `/api/*` untuk meneruskan permintaan ke GAS dengan penanganan timeout, otorisasi token, dan offline mock fallback yang realistis jika GAS belum di-deploy oleh pengguna.
   - Menyediakan endpoint referensi kode Google Apps Script versi Multi-RT (`/api/gas-source`) agar pengguna dapat menyalin langsung kode GAS terbaru ke editor spreadsheet mereka.
3. **Komponen Inti & State Management (`src/`)**:
   - Tipe data TypeScript untuk Multi-RT, Transaksi, Laporan, User, dan RBAC.
   - Layanan API klien (`src/services/api.ts`) dengan penyimpanan lokal (offline cache).
   - State konteks autentikasi & unit RT aktif.
4. **UI Gerbang Warga & Kunci PIN (`src/components/warga/`)**:
   - Selector RT yang intuitif + Keypad PIN sentuh 6-digit.
   - Pilihan "Ingat PIN di perangkat ini" dan penguncian manual.
5. **UI Dashboard Warga & Transparansi (`src/components/dashboard/`)**:
   - Kartu Hero Saldo Kas RT dengan mode sembunyikan/tampilkan nominal.
   - 4 Ringkasan KPI bulanan dan pemilih periode bulan/tahun.
   - Tabel riwayat transaksi dengan pencarian teks, filter kategori kejadian, dan pagination/scroll.
   - Fitur cetak laporan kas resmi RT/RW yang rapi (*print layout*).
6. **UI Monitoring Khusus RW (`src/components/rw/`)**:
   - Tampilan perbandingan kas semua RT (Total kas gabungan se-RW, rata-rata kas, tabel saldo per RT).
   - Pemilih RT cepat untuk menginspeksi transaksi masing-masing RT dalam mode *read-only*.
7. **UI Manajemen Transaksi & Administrasi RT (`src/components/admin/`)**:
   - Modal Bottom Sheet Tambah/Edit Transaksi dengan validasi nominal rupiah dan saldo negatif.
   - Modal pembatalan transaksi dengan alasan wajib.
   - Pengaturan saldo awal kas per RT dan ganti PIN Warga per RT.
   - Manajemen Akun Pengguna (Admin) & Manajemen Kategori Kas (Admin).
8. **Dukungan PWA & Offline Indicator**:
   - Konfigurasi Web App Manifest & Service Worker precaching.
   - Komponen in-app install prompt (`PWAInstallButton`) dengan panduan khusus iOS Safari.
   - Indikator status jaringan (Online/Offline banner).
9. **Verifikasi & Build Compilation**:
   - Menjalankan `compile_applet` dan `lint_applet` untuk menjamin nol kesalahan sintaks dan tipe.
