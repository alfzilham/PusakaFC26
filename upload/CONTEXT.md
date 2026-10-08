# CONTEXT.md — JeumalaCup 26

## 1. Latar Belakang Project

Sistem input nama/nomor jersey untuk event "JeumalaCup 26". Dibuat untuk memudahkan peserta mendaftarkan nama belakang dan nomor punggung baju bola mereka tanpa perlu membuat akun/login, sekaligus memberi panitia (admin) kontrol penuh atas data melalui panel terpisah dan terproteksi.

Project ini akan dieksekusi/dibangun melalui [chat.z.ai](https://chat.z.ai), menggunakan dokumen SPEC.md, ARCHITECTURE.md, dan DESIGN.md sebagai acuan.

## 2. Siapa yang Terlibat

- **Developer**: Alfiz Ilham (kontak developer juga ditampilkan di aplikasi untuk user yang perlu koreksi data).
- **Target pengguna**: Peserta/pemesan jersey (publik, tanpa akun) dan admin panitia (satu akun, akses password).

## 3. Keputusan Kunci (Decision Log)

| # | Topik | Keputusan |
|---|---|---|
| 1 | Login page | Tidak ada login untuk user publik |
| 2 | Proteksi admin | Password + rate limiting, path terpisah `/admin`, bukan dari sidebar publik |
| 3 | Rate limiting | 5x gagal → lock 15 menit |
| 4 | Validasi duplikat nama/nomor | Fetch sekali di awal + cek client-side real-time, re-validasi di server saat submit |
| 5 | Keunikan nama/nomor | Global, lintas gender (bukan per-gender pool terpisah) |
| 6 | Rentang No. Belakang | 1–999 |
| 7 | Panjang Nama Belakang | 2–20 karakter |
| 8 | Halaman 2 (nomor terpakai) | Satu daftar gabungan + badge gender, bukan tab terpisah |
| 9 | Opsi Lengan | Hanya 2: Panjang / Pendek |
| 10 | Setelah submit sukses | Toast/modal sukses, form reset di tempat (tetap di Halaman 1) |
| 11 | Edit/cancel oleh user | Tidak bisa — harus hubungi admin via WhatsApp |
| 12 | Konfirmasi aksi admin | Hapus perlu modal konfirmasi; Edit langsung tersimpan tanpa konfirmasi |
| 13 | Fitur tabel admin | Search bar + filter gender + pagination (20/halaman) |
| 14 | Export data | `.xlsx` (2 sheet: Pria & Wanita) dan `.json` |
| 15 | Database | PostgreSQL via Prisma di Railway |
| 16 | Tombol submit | Disabled saat invalid/loading, mencegah double-submit |

## 4. Kriteria Teknis Wajib

- Stack: React/Next.js (full-stack router), Prisma ORM, PostgreSQL, deploy di Railway.
- Font: Plus Jakarta Sans.
- Icon: Lucide React via CDN, tanpa emoji.
- Komponen custom wajib: scrollbar, dropdown, checkbox — semua dengan animasi smooth.
- Accessibility wajib diperhatikan (ARIA, keyboard nav, kontras warna).
- Desain: clean minimalism, mobile-first.

## 5. Hal yang Sengaja Di-skip / Out of Scope

- Tidak ada sistem akun/login untuk user publik.
- Tidak ada fitur edit/cancel self-service untuk user publik — semua koreksi manual lewat admin.
- Tidak ada notifikasi email/WA otomatis ke user setelah submit.

## 6. Dokumen Terkait

- `SPEC.md` — spesifikasi fungsional lengkap (field form, alur, fitur admin).
- `ARCHITECTURE.md` — stack teknis, schema Prisma, struktur folder, API routes, alur validasi, deployment.
- `DESIGN.md` — prinsip desain, komponen custom, layout, palet warna, accessibility checklist.
- Prompt siap pakai untuk chat.z.ai — lihat file terpisah.

## 7. Catatan Eksekusi

Kelima dokumen ini dirancang agar bisa langsung dipakai sebagai acuan oleh AI builder (chat.z.ai) maupun developer manusia, tanpa perlu klarifikasi ulang — seluruh ambiguitas yang mungkin muncul sudah diselesaikan lewat sesi Q&A dan dicatat di §3.
