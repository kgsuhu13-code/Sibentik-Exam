# Konsep Halaman Siswa (Student Portal)

Aplikasi siswa akan didesain dengan tampilan yang **bersih, fokus, dan minim distraksi** untuk memastikan siswa dapat mengerjakan ujian dengan tenang.

## 1. Struktur Menu Utama

### A. Dashboard (Beranda)
Halaman pertama yang dilihat siswa setelah login.
*   **Header**: Sapaan personal ("Halo, Budi Santoso") dan informasi kelas.
*   **Kartu Ujian Aktif**: Menampilkan ujian yang *sedang berlangsung* saat ini.
    *   Info: Nama Mapel, Judul Ujian, Sisa Waktu (jika sudah mulai), Status.
    *   Tombol: **"Kerjakan Sekarang"** (jika belum mulai) atau **"Lanjutkan"** (jika terputus).
*   **Jadwal Ujian**: Daftar ujian yang akan datang (Hari ini & Besok).
*   **Statistik Ringkas**: Jumlah ujian selesai, rata-rata nilai (opsional).

### B. Daftar Ujian (Exam List)
Halaman khusus yang memuat semua jadwal ujian.
*   **Tab "Tersedia"**: Ujian yang bisa dikerjakan saat ini. Membutuhkan **Token** untuk masuk.
*   **Tab "Akan Datang"**: Jadwal ujian di masa depan.
*   **Tab "Terlewat"**: Ujian yang sudah habis waktunya tapi siswa belum mengerjakan.

### C. Riwayat & Hasil (History)
Tempat siswa melihat rekam jejak ujian mereka.
*   **Daftar Ujian Selesai**: History ujian yang telah dikerjakan.
*   **Detail Nilai**: Menampilkan skor (jika diizinkan guru untuk dilihat).
*   **Pembahasan**: (Fitur Lanjutan) Melihat kunci jawaban dan pembahasan setelah ujian ditutup (opsional).

### D. Profil Saya
*   **Data Diri**: Foto, Nama Lengkap, NISN, Kelas.
*   **Pengaturan Akun**: Ganti password.
*   **Logout**: Keluar dari aplikasi.

---

## 2. Alur Pengerjaan Ujian (Exam Flow)

Ini adalah fitur inti (Core Feature) dari halaman siswa.

### Tahap 1: Lobi Ujian (Pre-Exam)
Setelah siswa memilih ujian dari Dashboard:
*   **Informasi Detail**: Judul, Durasi, Jumlah Soal, KKM.
*   **Peraturan Ujian**: Poin-poin tata tertib (Dilarang menyontek, dilarang buka tab lain, dll).
*   **Input Token**: Kolom besar untuk memasukkan 6 digit token dari guru.
*   **Tombol Mulai**: Aktif hanya jika token benar.

### Tahap 2: Antarmuka Ujian (The Exam Interface)
Tampilan saat mengerjakan soal. Harus **Full Screen** dan **Distraction Free**.
*   **Header Sticky**:
    *   **Timer Mundur**: Penunjuk waktu sisa yang jelas (berubah merah saat < 5 menit).
    *   **Info Siswa**: Nama & Kelas.
    *   **Ukuran Font**: Tombol untuk memperbesar/memperkecil teks soal.
*   **Area Soal (Kiri/Tengah)**:
    *   Nomor Soal.
    *   Konten Soal (Teks, Gambar, Rumus Matematika).
    *   Pilihan Jawaban (A, B, C, D, E) yang bisa diklik.
*   **Navigasi Soal (Sidebar Kanan - Bisa di-hide di Mobile)**:
    *   Grid nomor soal.
    *   **Kode Warna**:
        *   Hijau: Sudah dijawab.
        *   Kuning: Ragu-ragu.
        *   Abu-abu: Belum dijawab.
        *   Biru: Posisi soal saat ini.
*   **Footer Controls**:
    *   Tombol "Sebelumnya" & "Selanjutnya".
    *   Checkbox **"Ragu-ragu"**.
    *   Tombol **"Selesai Ujian"** (hanya muncul di nomor terakhir).

### Tahap 3: Konfirmasi Selesai
*   Pop-up peringatan jika masih ada soal yang belum dijawab atau ragu-ragu.
*   Konfirmasi akhir "Apakah Anda yakin ingin mengakhiri ujian?".

### Tahap 4: Halaman Selesai
*   Pesan "Terima kasih telah mengerjakan".
*   Tombol "Kembali ke Dashboard".

---

## 3. Fitur Keamanan (Anti-Cheating) - *Opsional/Tahap Lanjut*
*   **Fullscreen Mode**: Memaksa browser layar penuh.
*   **Blur Detection**: Mendeteksi jika siswa pindah tab atau membuka aplikasi lain (bisa diberi peringatan atau auto-submit).
*   **Disable Copy-Paste**: Mencegah klik kanan dan seleksi teks.
