# PANDUAN PENGGUNA (USER MANUAL)
## SISTEM PELAPORAN INSIDEN KESELAMATAN PASIEN (IKP) & MANAJEMEN MUTU
### RS AIRAN RAYA LAMPUNG SELATAN

---

## DAFTAR ISI
1. [Tentang Sistem](#1-tentang-sistem)
2. [Alur Kerja Terintegrasi (End-to-End Workflow)](#2-alur-kerja-terintegrasi-end-to-end-workflow)
3. [Panduan Masuk Sistem (Login)](#3-panduan-masuk-sistem-login)
4. [Petunjuk Modul Staf / Perawat (Form IKP-1 Kronologi)](#4-petunjuk-modul-staf--perawat-form-ikp-1-kronologi)
5. [Petunjuk Modul Kepala Ruangan / Karu (Form IKP-2 Grading Risiko)](#5-petunjuk-modul-kepala-ruangan--karu-form-ikp-2-grading-risiko)
6. [Petunjuk Modul Kepala Seksi / Kasie (Verifikasi & Pengesahan)](#6-petunjuk-modul-kepala-seksi--kasie-verifikasi--pengesahan)
7. [Petunjuk Modul Komite Mutu (Form IKP-3 Investigasi Sederhana)](#7-petunjuk-modul-komite-mutu-form-ikp-3-investigasi-sederhana)
8. [Pengaturan Profil & Notifikasi WhatsApp](#8-pengaturan-profil--notifikasi-whatsapp)
9. [Panduan Cetak Dokumen Resmi RS](#9-panduan-cetak-dokumen-resmi-rs)
10. [Tanya Jawab & Solusi Kendala (FAQ & Troubleshooting)](#10-tanya-jawab--solusi-kendala-faq--troubleshooting)

---

## 1. TENTANG SISTEM

Sistem Informasi Pelaporan Insiden Keselamatan Pasien (IKP) dan Manajemen Mutu RS Airan Raya merupakan aplikasi berbasis web modern yang dirancang untuk mempermudah, mempercepat, serta mendokumentasikan setiap insiden keselamatan pasien secara aman, terukur, dan akuntabel sesuai standar keselamatan pasien nasional (KARS / Kemenkes).

### Keunggulan Sistem:
* **Paperless & Terintegrasi Data Pasien**: Terhubung langsung dengan database pasien (No RM, Nama, Ruangan, Tanggal Masuk).
* **Tanda Tangan Digital (Digital Signature Canvas)**: Pengesahan langsung di layar HP/Tablet/Komputer tanpa perlu cetak dan scan ulang.
* **Notifikasi Otomatis WhatsApp**: Pemberitahuan real-time langsung ke WhatsApp pejabat/staf terkait setiap kali ada laporan, disposisi, atau hasil verifikasi.
* **Akses Fleksibel (Desktop & Mobile Friendly)**: Dapat digunakan melalui komputer ruang rawat maupun smartphone staf saat bertugas.

---

## 2. ALUR KERJA TERINTEGRASI (END-TO-END WORKFLOW)

Proses pelaporan insiden mengikuti alur berjenjang dengan pembagian tanggung jawab yang jelas:

```
┌────────────────────────────────────────────────────────┐
│ 1. STAF / PERAWAT (Pelapor)                            │
│    • Input kronologi kejadian kejadian (IKP-1)         │
│    • Tarik data pasien via No. RM                      │
│    • Tanda tangan digital                              │
│    • Pilih Karu & Kirim                                │
└──────────────────────────┬─────────────────────────────┘
                           │ 📲 [Notifikasi WhatsApp ke Karu]
                           ▼
┌────────────────────────────────────────────────────────┐
│ 2. KEPALA RUANGAN (Karu)                               │
│    • Terima laporan masuk unit                         │
│    • Lengkapi Rincian Kejadian & Jenis Insiden         │
│    • Tentukan Matriks Grading Risiko (Biru/Hijau/Kuning/Merah)
│    • Tanda tangan digital Karu                         │
│    • Pilih Kasie Pembina & Disposisi                   │
└──────────────────────────┬─────────────────────────────┘
                           │ 📲 [Notifikasi WhatsApp ke Kasie]
                           ▼
┌────────────────────────────────────────────────────────┐
│ 3. KEPALA SEKSI (Kasie)                                │
│    • Tinjau uraian kejadian & ketepatan grading risiko │
│    • Bubuhkan tanda tangan pengesahan verifikasi       │
│    • Status berubah: TERVERIFIKASI                     │
└──────────────────────────┬─────────────────────────────┘
                           │ 📲 [Notifikasi WhatsApp ke Komite Mutu]
                           ▼
┌────────────────────────────────────────────────────────┐
│ 4. KOMITE MUTU                                         │
│    • Menerima laporan yang sudah disahkan Kasie        │
│    • Mengidentifikasi akar masalah (Root Cause)        │
│    • Menyusun tabel rekomendasi tindakan perbaikan     │
│    • Verifikasi final & Rekapitulasi Laporan Rumah Sakit│
└────────────────────────────────────────────────────────┘
```

---

## 3. PANDUAN MASUK SISTEM (LOGIN)

1. Buka browser (Google Chrome, Microsoft Edge, atau Safari) pada komputer atau smartphone Anda.
2. Masukkan alamat URL aplikasi IKP Mutu RS Airan Raya.
3. Pada halaman Login:
   * **Pilih Peran / Akses Sebagai**:
     * `Tenaga Perawat`: Untuk perawat/staf ruangan rawat inap, jalan, IGD, atau penunjang.
     * `Kepala Ruangan (Karu)`: Untuk Kepala Ruangan/Unit kerja.
     * `Kepala Seksi (Kasie)`: Untuk Kepala Seksi/Koordinator yang membawahi unit.
     * `Tim Mutu`: Untuk anggota Komite Mutu RS.
     * `Karyawan Lainnya`: Untuk staf non-keperawatan (radiologi, lab, farmasi, umum).
     * `Administrator`: Untuk pengelola sistem & IT.

### Detail Cara Login Berdasarkan Peran:
* **Tenaga Perawat**:
  1. Pada kotak **Username**, ketik minimal 3 huruf nama Anda.
  2. Klik nama Anda dari daftar dropdown yang muncul.
  3. Masukkan **Password** Anda (sesuai data akun SIMRS/kepegawaian Anda).
  4. Klik tombol **Masuk Aplikasi**.
* **Kepala Ruangan, Kasie, Tim Mutu, & Admin**:
  1. Masukkan **Username** akun Anda.
  2. Masukkan **Password**.
  3. Klik ikon mata jika ingin melihat sandi yang diketik.
  4. Klik tombol **Masuk Aplikasi**.
* **Karyawan Lainnya**:
  1. Ketik nama Anda di kotak pencarian, pilih nama Anda (NIK akan terdeteksi otomatis).
  2. Masukkan alamat **Email** Anda.
  3. Klik tombol **Masuk**.

---

## 4. PETUNJUK MODUL STAF / PERAWAT (FORM IKP-1 KRONOLOGI)

Modul ini digunakan oleh staf pertama yang mengetahui, menemukan, atau terlibat dalam insiden keselamatan pasien untuk mencatat kronologi kejadian yang akurat dan objektif.

### Langkah 1: Membuka Form Pelaporan Baru
1. Pada **Dashboard**, klik tombol **+ Buat Laporan Baru** (atau buka menu **Kronologi** pada navigasi, lalu klik **+ Buat Laporan**).
2. Anda akan diarahkan ke halaman formulir pelaporan insiden (IKP-1).

### Langkah 2: Memilih Data Pasien
1. Pada bagian **Pilih Pasien**, ketik minimal **3 huruf nama pasien atau nomor Rekam Medis (RM)** di kolom pencarian.
2. Tekan tombol **Cari** (atau tekan **Enter** pada keyboard).
3. Hasil pencarian dari database RS akan muncul. Klik pada baris pasien yang sesuai.
4. Data pasien (Nama, No RM, dan No Transaksi kunjungan) akan terkunci dan tampil di kotak hijau/biru.

### Langkah 3: Mengisi Kronologi Kejadian (Informasi Kejadian)
1. Perhatikan bagian **Informasi Kejadian**.
2. Masukkan **Tanggal & Jam** waktu insiden berlangsung (format tanggal & waktu).
3. Pada kolom **Uraian Singkat**, tuliskan kejadian secara runut, jelas, dan faktual (mengandung unsur: apa yang terjadi, kapan, di mana, bagaimana kondisinya).
4. **Menambah Baris Kronologis**: Jika kejadian memiliki beberapa tahapan waktu (misal: jam 10:00 pasien lapor pusing, jam 10:15 pasien terpeleset, jam 10:20 perawat memberikan pertolongan pertama), klik tombol **+ Tambah Baris** untuk menambahkan urutan kejadian berikutnya.
5. Tombol tempat sampah merah dapat digunakan jika ingin menghapus baris tertentu.

### Langkah 4: Membubuhkan Tanda Tangan Digital
1. Gulir ke bawah ke bagian **Konfirmasi & Tanda Tangan**.
2. Pada kanvas tanda tangan (kotak putih berbingkai), gunakan mouse (jika di komputer) atau jari/stylus pen (jika di layar sentuh HP/Tablet) untuk menggoreskan tanda tangan Anda.
3. Jika tanda tangan keliru, klik tombol **Hapus/Ulangi** pada kanvas untuk mengulang.
4. Tanda tangan ini menjadi bukti otentik pengesahan laporan oleh staf pelapor.

### Langkah 5: Memilih Kepala Ruangan & Mengirim Laporan
1. Pada panel samping kanan (atau bagian bawah pada tampilan smartphone), temukan kotak **Kirim ke Atasan (Karu)**.
2. Pilih nama **Kepala Ruangan (Karu)** yang membawahi unit kerja Anda dari menu dropdown.
3. Anda memiliki 2 opsi penyimpanan:
   * **Simpan Draf**: Jika laporan masih ingin diedit kemudian dan belum diserahkan ke Karu.
   * **Kirim Laporan ke Karu**: Laporan akan dikirim resmi ke Karu. Sistem secara otomatis mengirimkan notifikasi pesan WhatsApp ke Kepala Ruangan bersangkutan bahwa ada insiden baru yang memerlukan penanganan.
4. Setelah terkirim, formulir akan terkunci dan status laporan pada daftar Anda berubah menjadi **✓ Terkirim**.

---

## 5. PETUNJUK MODUL KEPALA RUANGAN / KARU (FORM IKP-2 GRADING RISIKO)

Kepala Ruangan (Karu) bertanggung jawab melakukan investigasi awal, verifikasi kebenaran laporan staf, mengisi rincian insiden, dan menentukan matriks grading risiko sebelum diteruskan ke Kepala Seksi.

### Langkah 1: Menerima Notifikasi & Membuka Laporan
1. Ketika staf mengirim kronologi, Karu akan menerima pesan WhatsApp otomatis berisi rincian: No Transaksi, Nama Pasien, dan Pelapor.
2. Buka aplikasi dan pilih menu **Grading** (atau klik kartu **Menunggu Grading Karu** pada Dashboard).
3. Anda akan melihat daftar laporan dengan status:
   * 🟡 **Menunggu Grading Karu**: Laporan baru masuk dari perawat, belum dinilai.
   * 🔵 **Menunggu Verifikasi Kasie**: Sudah di-grade oleh Karu, sedang menunggu tanda tangan Kasie.
   * 🟢 **Terverifikasi Kasie**: Selesai diverifikasi oleh pimpinan.
4. Klik pada baris laporan pasien yang ingin Anda proses.

### Langkah 2: Memeriksa Data & Riwayat Kronologi
1. Pada panel sebelah kiri (atau klik tombol **Lihat Kronologi** pada HP), Anda dapat membaca urutan uraian kejadian yang ditulis oleh perawat pelapor beserta tanda tangan digitalnya.
2. Pada panel formulir (sebelah kanan), terdapat 3 tab:
   * **Tab I: DATA**: Memuat identitas lengkap pasien dari sistem (Nama, No RM, Ruangan, Umur, Jenis Kelamin, Penjamin/BPJS/Asuransi, Tanggal Masuk RS). Periksa dan sesuaikan nama Ruangan jika diperlukan.
   * **Tab II: RINCIAN**: Formulir investigasi risiko unit.
   * **Tab III: TTD & VERIFIKASI**: Lembar penandatanganan dan pemilihan Kasie.

### Langkah 3: Mengisi Rincian Kejadian (Tab II)
Buka tab **II. RINCIAN**, lengkapi seluruh isian berikut:
1. **Tanggal & Jam Insiden**: Waktu tepat kejadian berlangsung.
2. **Insiden**: Nama insiden (misal: *Pasien Jatuh dari Tempat Tidur*, *Keterlambatan Pemberian Antibiotik*, *Salah Label Sampel Darah*).
3. **Kronologis Insiden**: Rangkuman kronologi kejadian berdasarkan investigasi unit.
4. **Jenis Insiden**:
   * `KNC (Kejadian Nyaris Cedera)`: Terpapar tapi belum sempat terjadi cedera (near miss).
   * `KTD (Kejadian Tidak Diharapkan)`: Insiden yang mengakibatkan cedera pada pasien.
   * `SENTINEL`: Kejadian tidak terduga yang mengakibatkan kematian atau cedera permanen.
5. **Orang Pertama yang Melaporkan**: Pilih Karyawan, Pasien, Keluarga, Pengunjung, atau Lain-lain.
6. **Insiden Menyangkut**: Rawat Inap, Rawat Jalan, UGD, atau Lainnya.
7. **Tempat Insiden & Unit Kerja**: Tuliskan nama ruangan/lokasi spesifik kejadian.
8. **Akibat Insiden Terhadap Pasien**:
   * Kematian
   * Cedera Irreversibel / Cedera Berat
   * Cedera Reversibel / Cedera Sedang
   * Cedera Ringan / Tidak Ada Cedera
9. **Tindakan Segera**: Penanganan awal yang langsung dilakukan oleh petugas setelah insiden.
10. **Tindakan Dilakukan Oleh**: Tim, Dokter, Perawat, atau Petugas lainnya.
11. **Kejadian Sama di Unit Lain**: Pilih Ya/Tidak (jika Ya, sebutkan waktu dan langkah penanganannya).
12. **Grading Risiko Kejadian**: Tentukan warna matriks risiko berdasarkan dampak (konsekuensi) dan frekuensi (probabilitas):
    * 🔵 **BIRU**: Risiko Rendah
    * 🟢 **HIJAU**: Risiko Sedang
    * 🟡 **KUNING**: Risiko Tinggi
    * 🔴 **MERAH**: Risiko Ekstrim / Sangat Tinggi

### Langkah 4: Tanda Tangan Karu & Pemilihan Kasie (Tab III)
1. Pindah ke tab **TTD & VERIFIKASI**.
2. Pada kolom **I. Pembuat Laporan (Kepala Ruangan)**, bubuhkan tanda tangan digital Anda pada kanvas tanda tangan.
3. Pada kolom **II. Penerima Laporan / Verifikasi (Kasie)**:
   * Buka dropdown **Pilih Kepala Seksi (Kasie) Tujuan Verifikasi**.
   * Pilih nama Kepala Seksi yang membawahi unit kerja Anda (misal: *Kasie Keperawatan*, *Kasie Pelayanan Medis*, dsb.).
4. Klik tombol **Simpan / Kirim Grading**.
5. Sistem akan menyimpan penilaian Anda dan mengirimkan **notifikasi WhatsApp otomatis** ke Kepala Seksi yang dipilih bahwa ada laporan grading yang siap diverifikasi.

---

## 6. PETUNJUK MODUL KEPALA SEKSI / KASIE (VERIFIKASI & PENGESAHAN)

Kepala Seksi bertindak sebagai verifikator tingkat pimpinan madya untuk memastikan penilaian risiko unit sudah tepat dan mengambil langkah arahan lebih lanjut.

### Langkah 1: Menerima Notifikasi WhatsApp
1. Kasie akan menerima pesan WhatsApp otomatis berbunyi:
   *"Halo [Nama Kasie], Laporan grading insiden baru telah dikirimkan ke Anda oleh Karu untuk pasien [Nama Pasien]... Mohon segera lakukan verifikasi dan tanda tangan di aplikasi IKP-Mutu."*
2. Masuk ke aplikasi menggunakan akun Kasie Anda.

### Langkah 2: Membuka Daftar Tugas Verifikasi
1. Pada **Dashboard**, kartu **Perlu Verifikasi Kasie** akan menampilkan jumlah laporan yang sedang menunggu pengesahan Anda (dengan lencana merah *Perlu Tindakan*).
2. Klik menu **Grading** (atau klik kartu di Dashboard).
3. Gunakan filter tab **Menunggu Verifikasi Kasie** atau ketik nama pasien pada kolom pencarian.
4. Klik tombol **Verifikasi TTD** (atau klik baris laporan pasien).

### Langkah 3: Melakukan Review Laporan
1. Periksa data pasien pada **Tab I (DATA)**.
2. Periksa detail kronologi perawat pada panel kiri.
3. Periksa ketepatan **Jenis Insiden** dan **Grading Risiko** (Biru/Hijau/Kuning/Merah) yang ditetapkan Karu pada **Tab II (RINCIAN)**.

### Langkah 4: Menandatangani & Mengesahkan Laporan
1. Buka tab **TTD & VERIFIKASI**.
2. Anda dapat melihat tanda tangan digital Karu sudah tertera di kolom sebelah kiri.
3. Pada kolom sebelah kanan (**Verifikasi Kasie**), bubuhkan tanda tangan digital Anda sebagai pengesahan resmi.
4. Klik tombol **Verifikasi & Sahkan Laporan** (atau tombol Simpan di atas).
5. Muncul notifikasi sukses: *"Verifikasi Kasie Berhasil. Laporan grading risiko telah berhasil diverifikasi & disahkan."*
6. **Dampak Otomatis**:
   * Status laporan berubah menjadi **TERVERIFIKASI**.
   * Sistem secara otomatis mengirimkan notifikasi WhatsApp ke **Komite Mutu Rumah Sakit** bahwa laporan telah lengkap dan siap ditindaklanjuti dengan investigasi lanjutan.

---

## 7. PETUNJUK MODUL KOMITE MUTU (FORM IKP-3 INVESTIGASI SEDERHANA)

Komite Mutu Rumah Sakit bertanggung jawab melakukan investigasi menyeluruh terhadap laporan yang telah terverifikasi, mengidentifikasi akar masalah, serta menetapkan rekomendasi perbaikan mutu keselamatan pasien.

### Langkah 1: Memantau Laporan Masuk
1. Komite Mutu menerima pesan WhatsApp otomatis setiap kali Kasie menyelesaikan verifikasi laporan insiden.
2. Masuk ke aplikasi dengan akun Tim Mutu.
3. Buka menu **Investigasi**.
4. Gunakan tab filter di bagian atas:
   * **Semua**: Seluruh laporan yang ada di rumah sakit.
   * **Siap Diinvestigasi**: Laporan yang sudah disahkan Kasie namun belum dibuatkan lembar investigasi IKP-3.
   * **Selesai**: Laporan yang sudah memiliki lembar investigasi lengkap.
   * **Menunggu Kasie**: Laporan yang masih tertahan di meja Kepala Seksi.

### Langkah 2: Memilih Laporan & Sinkronisasi Data
1. Klik pada baris laporan pasien yang siap diinvestigasi.
2. Panel detail akan terbuka menampilkan rangkuman data pasien, grading risiko, serta status verifikasi Kasie beserta tanda tangan digitalnya.
3. Pada form sebelah kanan (**Form Laporan Investigasi Sederhana**), perhatikan kolom penanggung jawab:
   * Nama Kepala Ruangan akan terisi otomatis.
   * Pada kolom **Kasie / Kasubag**, klik tombol **Sinkronkan dari Grading** agar nama Kasie yang memverifikasi otomatis terisi dan terhubung secara valid.

### Langkah 3: Mengisi Akar Masalah & Periode Investigasi
1. Pada kolom **Penyebab yang melatarbelakangi / akar masalah Insiden**, tuliskan hasil penelusuran tim mutu mengenai *root cause* kejadian (faktor manusia, lingkungan, alat, komunikasi, prosedur, dsb.).
2. Tentukan **Tgl. Mulai Investigasi** dan **Tgl. Selesai Investigasi**.

### Langkah 4: Menyusun Tabel Tindakan & Rekomendasi
1. Pada bagian **Tindakan & Rekomendasi**, tentukan langkah-langkah perbaikan agar insiden tidak terulang:
   * **Rekomendasi**: Rekomendasi solusi pencegahan (misal: *Pengadaan bed rail ekstra*, *Revisi SOP pemberian obat konsentrasi tinggi*).
   * **Tindakan yang telah dilakukan**: Langkah nyata yang sudah dieksekusi oleh unit.
   * **Penanggung Jawab (PJ)**: Nama atau unit yang bertindak sebagai penanggung jawab eksekusi rekomendasi.
   * **Tanggal**: Batas waktu (deadline) penyelesaian rekomendasi.
2. Klik tombol **+ Tambah Baris** jika terdapat lebih dari satu rekomendasi tindakan perbaikan. Gunakan tombol **Hapus** jika baris tidak diperlukan.

### Langkah 5: Menyimpan Investigasi & Verifikasi Akhir
1. Klik tombol **Simpan Laporan Investigasi**.
2. Jika diperlukan pengesahan akhir, klik tombol **Verifikasi Kronologi Ini** agar status pelaporan pada rumah sakit menjadi tuntas (verified).

---

## 8. PENGATURAN PROFIL & NOTIFIKASI WHATSAPP

Agar setiap pengguna menerima pemberitahuan otomatis ke ponsel masing-masing, setiap staf wajib memastikan data profilnya terisi dengan benar.

### Cara Memperbarui Nama & Nomor WhatsApp:
1. Klik foto avatar / nama Anda di pojok kanan atas layar, lalu pilih menu **Profile** (atau klik ikon Profil pada bilah navigasi bawah smartphone).
2. Pada tab **Informasi Akun**:
   * **Nama Lengkap**: Masukkan nama lengkap Anda beserta gelar dinas/keperawatan.
   * **Nomor WhatsApp**: Masukkan nomor WhatsApp aktif Anda (contoh format: `081234567890` atau `6281234567890`).
3. Klik tombol **Simpan Perubahan Profil**.
4. Notifikasi notifikasi WhatsApp untuk tugas-tugas Anda akan langsung aktif ke nomor tersebut.

### Cara Mengganti Kata Sandi:
1. Pada halaman Profil, buka tab **Ganti Kata Sandi**.
2. Masukkan **Kata Sandi Saat Ini**.
3. Masukkan **Kata Sandi Baru** (minimal 6 karakter).
4. Masukkan kembali pada kolom **Konfirmasi Kata Sandi Baru**.
5. Klik **Perbarui Kata Sandi**.

---

## 9. PANDUAN CETAK DOKUMEN RESMI RS

Aplikasi menyediakan format cetak standar rumah sakit lengkap dengan Kop Surat resmi RS Airan Raya Lampung Selatan:

* **Mencetak Form IKP-1 (Kronologi Staf)**:
  Buka laporan di menu Kronologi, lalu klik tombol **Cetak** berikon printer di bagian atas form.
* **Mencetak Form IKP-2 (Grading Risiko Insiden)**:
  Buka laporan di menu Grading, klik tombol **Cetak Form** di sebelah kanan atas.
* **Mencetak Form IKP-3 (Laporan Investigasi Sederhana)**:
  Buka laporan di menu Investigasi, klik tombol **Cetak** pada tampilan formulir.

> **Tips Saat Mencetak**:
> 1. Pada kotak dialog printer browser, pilih Destination: **Save as PDF** jika ingin menyimpan sebagai dokumen digital.
> 2. Centang opsi **Background graphics** pada More Settings agar warna lencana dan tabel tercetak sempurna.
> 3. Tanda tangan digital akan otomatis tercetak di lembar pengesahan dokumen.

---

## 10. TANYA JAWAB & SOLUSI KENDALA (FAQ & TROUBLESHOOTING)

### Q1: Pasien tidak muncul saat dicari di form Kronologi?
* **Penyebab**: Kata kunci pencarian kurang dari 3 huruf atau format nomor RM keliru.
* **Solusi**: Pastikan mengetik minimal 3 karakter (contoh: ketik `0123` untuk No RM atau ketik minimal 3 huruf nama pasien). Tekan tombol **Cari** atau tekan **Enter**. Pastikan pasien telah terdaftar di admisi RS.

### Q2: Mengapa saya tidak menerima notifikasi WhatsApp saat ada laporan baru?
* **Penyebab**: Nomor telepon di profil akun Anda belum diisi atau format nomor salah.
* **Solusi**: Masuk ke menu **Profile**, pastikan kolom **Nomor WhatsApp** telah terisi nomor aktif Anda, lalu klik Simpan.

### Q3: Tanda tangan digital saya salah gores, bagaimana memperbaikinya?
* **Solusi**: Klik tombol **Hapus** di bawah kanvas tanda tangan, lalu goreskan kembali tanda tangan Anda yang benar sebelum menekan tombol simpan/kirim.

### Q4: Apakah laporan yang sudah dikirim ke Karu masih bisa diubah oleh perawat?
* **Solusi**: Laporan yang sudah berstatus **Terkirim** akan dikunci demi keamanan dan keabsahan data medikolegal. Jika terdapat kekeliruan fatal, hubungi Kepala Ruangan Anda agar dicatat penyesuaiannya pada lembar rincian kejadian Karu.

### Q5: Kasie tidak menemukan laporan ruangan pada daftar gradingnya?
* **Penyebab**: Kepala Ruangan (Karu) saat mengisi grading belum memilih nama Kasie tujuan pada dropdown di tab TTD & Verifikasi.
* **Solusi**: Minta Karu membuka kembali laporan tersebut di menu Grading, pilih nama Kasie bersangkutan pada tab TTD & Verifikasi, lalu klik Simpan.

---
*Dokumen ini diterbitkan oleh Komite Mutu & Keselamatan Pasien bekerjasama dengan Tim IT RS Airan Raya Lampung Selatan.*
