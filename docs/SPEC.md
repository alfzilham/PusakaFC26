# SPEC.md — PusakaFC26 Jersey Order System

## 1. Overview

Sistem input pemesanan nama/nomor punggung jersey untuk event "PusakaFC26". Tidak ada login page untuk pengguna umum. Terdapat halaman admin terproteksi password untuk melihat, mengelola, dan mengekspor data.

## 2. User Flow

1. User membuka root URL.
2. Splash screen: logo dengan animasi scale 0.3 → 1 + fade in (~800ms), lalu fade out.
3. Transisi ke halaman UI utama.
4. Skeleton loader tampil selama proses fetch data awal (list nama/nomor terpakai), minimum tampil 400ms agar tidak flicker.
5. Form Halaman 1 muncul setelah loading selesai.

## 3. Halaman Publik

### 3.1 Halaman 1 — "Form Pendaftaran Jersey"

| Field | Tipe | Aturan Validasi |
|---|---|---|
| Gender | Dropdown custom | Required. Opsi: Pria / Wanita |
| Nama Lengkap | Text input | Required, min 3 karakter |
| Nama Belakang baju | Text input | Required, 2–20 karakter, alfanumerik + spasi, **unik global** |
| No. Belakang baju | Number input | Required, integer 1–999, **unik global** |
| Ukuran | Dropdown custom | Required. Opsi: S, M, L, XL, XXL, XXXL |
| Panjang/Pendek Lengan | Dropdown custom | Required. Opsi: Panjang / Pendek |
| Submit button | Button | Disabled jika ada field kosong/invalid atau sedang submitting (loading spinner). Mencegah double-submit |

**Validasi duplikat (Nama Belakang & No. Belakang):**
- Keunikan **global**, lintas gender (bukan per-gender).
- Mekanisme: seluruh data nama/nomor terpakai di-fetch sekali saat page load (bersamaan dengan skeleton loader), lalu validasi dilakukan di client-side secara instan saat user mengetik — tanpa request berulang per keystroke.
- Validasi ulang wajib dilakukan di server saat submit (menangani race condition jika dua user submit bersamaan).
- Setelah submit sukses, data cache di-refetch agar user berikutnya mendapat daftar ter-update.

**Setelah submit sukses:**
- Tampilkan toast sukses (slide-in dari atas, auto-dismiss 3 detik).
- Form di-reset otomatis, tetap di Halaman 1.
- User **tidak bisa** mengedit/membatalkan input sendiri — harus menghubungi admin via WhatsApp (nomor super admin) untuk koreksi.

### 3.2 Halaman 2 — "Nomor Punggung Terpakai"

- Menampilkan satu daftar gabungan nomor punggung yang sudah dipakai.
- Setiap item disertai badge/label gender (Pria/Wanita).
- Read-only, tidak ada aksi interaktif untuk user publik.

## 4. Navigasi

### 4.1 Top Bar
```
[ Logo ] [ PusakaFC26 ]                    [ Hamburger menu ]
```

### 4.2 Sidebar (dibuka via hamburger menu)
- Nama Brand "PusakaFC26" + logo — bagian atas.
- Link ke Halaman 1 (Form Pendaftaran Jersey).
- Link ke Halaman 2 (Nomor Punggung Terpakai).
- "Lihat Detail Data" — terlihat tapi **disabled/tidak dapat diklik** untuk user publik (khusus admin, diakses lewat path terpisah `/admin`).
- "Information" (sticky, posisi seperti tombol setting), berisi sub-menu:
  - About (deskripsi software).
  - Privacy Policy.
  - Terms of Services.
  - Admin Contact: kanal komunikasi admin event.
  - Super Admin Contact: Nama "Alfiz Ilham", No. WA "0852-1389-6460".

## 5. Admin Panel (`/admin`)

### 5.1 Proteksi Akses
- Tidak ada login page publik — admin mengakses langsung via path `/admin`.
- Login form: password-based.
- Rate limiting: 5x percobaan gagal → lock 15 menit (dicatat per IP).

### 5.2 Fitur Admin
- **Dashboard summary cards**: total entri, total Pria, total Wanita.
- **Akses admin dan super admin**:
  - Admin hanya dapat melihat data dan statistik.
  - Export, edit, hapus, dan nomor punggung duplikat membutuhkan verifikasi super admin.
- **Export data**:
  - `.xlsx` — 2 sheet terpisah: "Pria" dan "Wanita".
  - `.json` — seluruh data.
- **Tabel data**:
  - Search bar (nama lengkap / nama belakang / nomor).
  - Filter gender (custom checkbox atau dropdown).
  - Pagination: 20 entri/halaman.
- **Row actions**:
  - Edit — inline atau modal, langsung tersimpan tanpa konfirmasi tambahan.
  - Hapus — wajib modal konfirmasi sebelum eksekusi.

## 6. Validasi Field — Ringkasan

| Field | Aturan |
|---|---|
| Nama Lengkap | required, min 3 karakter |
| Nama Belakang | required, 2–20 karakter, unik global, alfanumerik + spasi |
| No. Belakang | required, integer 1–999, unik global |
| Ukuran | required, enum (S/M/L/XL/XXL/XXXL) |
| Lengan | required, enum (Panjang/Pendek) |
| Submit button | disabled saat invalid atau loading |

## 7. UI Requirements (Wajib)

1. Font: **Plus Jakarta Sans**.
2. Icon: **Lucide React** (CDN), **tidak boleh** menggunakan emoji.
3. Komponen custom dengan animasi smooth:
   - Custom scrollbar (WebKit + Firefox fallback).
   - Custom dropdown (fade + scale animation, keyboard nav, ARIA `listbox`).
   - Custom checkbox (animasi check smooth).
4. Accessibility: ARIA labels, keyboard navigation, focus states.
5. Mobile-first, clean minimalism.

## 8. Out of Scope

- Login/akun untuk user publik.
- Edit/cancel self-service untuk user publik.
- Notifikasi otomatis (email/WA blast) ke user.
