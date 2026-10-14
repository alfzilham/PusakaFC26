# Panduan Migrasi PusakaFC26 ke Organization dan Vercel

> **Status:** Migrasi repository dan aplikasi sudah selesai. Bagian di bawah dipertahankan sebagai catatan proses; arsitektur aktualnya adalah Next.js, OCR, dan PostgreSQL di Vercel/Supabase. WAHA sudah dihapus dari project.

Dokumen ini mencatat rencana migrasi project PusakaFC26 dari repository personal ke organization `pusakajeumala26`, serta pemindahan deployment aplikasi Next.js ke akun Vercel organization tersebut.

## Arsitektur target

```text
GitHub Organization pusakajeumala26
        │
        └── Repository PusakaFC26
                │
                ├── Next.js App  → Vercel
                ├── OCR FastAPI  → Vercel
                ├── PostgreSQL   → Supabase
                └── Supabase Storage
```

Next.js dan OCR berjalan sebagai project terpisah di Vercel. Database menggunakan Supabase PostgreSQL dan storage receipt menggunakan Supabase Storage. Tidak ada service WAHA atau environment WAHA yang diperlukan.

## 1. Persiapan

1. Pastikan branch fitur sudah di-push.
2. Pastikan Pull Request Struk Scanner sudah siap di-review atau sudah di-merge.
3. Pastikan release dan tag penting sudah tersedia.
4. Pastikan project OCR dan database Supabase sudah aktif.
5. Simpan daftar environment variable serta domain yang sedang digunakan.

Repository target yang direkomendasikan:

```text
https://github.com/pusakajeumala26/PusakaFC26
```

## 2. Transfer repository ke organization

Di GitHub:

```text
alfzilham/PusakaFC26
→ Settings
→ Danger Zone
→ Transfer
```

Pilih organization `pusakajeumala26` dan pertahankan nama repository `PusakaFC26`.

Transfer membutuhkan hak administrator repository dan izin membuat repository di organization tujuan. Issues, Pull Requests, Releases, dan isi repository tetap ikut berpindah.

Setelah transfer selesai, ubah remote lokal:

```powershell
cd "D:\2026\Workspace\PersonalApps\PusakaFC26"
git remote set-url origin https://github.com/pusakajeumala26/PusakaFC26.git
git remote -v
```

## 3. Perbarui referensi repository

```powershell
rg -n "alfzilham/PusakaFC26|github.com/alfzilham|alfzilham" `
  --glob '!node_modules' `
  --glob '!.next' `
  --glob '!.git'
```

Periksa terutama `src/lib/constants.ts`, `README.md`, `docs/`, `worklog.md`, link changelog, link Issues/Pull Requests, badge, dan URL GitHub lainnya.

Arahkan link repository ke:

```text
https://github.com/pusakajeumala26/PusakaFC26
```

## 4. Hubungkan organization ke Vercel

Pada akun/team Vercel milik `pusakajeumala`:

1. Buka **Add New → Project**.
2. Pilih **Import Git Repository**.
3. Hubungkan GitHub organization `pusakajeumala26`.
4. Pilih repository `PusakaFC26`.
5. Pastikan team Vercel yang aktif adalah akun organization yang benar.

## 5. Konfigurasi project Vercel

```text
Framework Preset: Next.js
Root Directory: /
Install Command: bun install
Build Command: bun run build
Output Directory: default
```

## 6. Environment variable Vercel

Tambahkan variable berikut pada environment **Production** dan **Preview**:

```env
DATABASE_URL=...
ADMIN_PASSWORD=...
ADMIN_SESSION_SECRET=...
SUPER_ADMIN_PASSWORD=...
OCR_SERVICE_URL=https://pusakafc26-ocr.vercel.app
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=receipts
NODE_ENV=production
```

`GEMINI_API_KEY` dan `GEMINI_MODEL` digunakan oleh service OCR Vercel, bukan oleh Next.js. Setiap perubahan environment variable harus diikuti deployment baru agar aktif.

## 7. Environment service OCR Vercel

```env
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.5-flash-lite
```

Tidak ada volume atau session WhatsApp yang perlu dipertahankan.

## 8. Pengujian deployment Vercel

Uji halaman utama, form pendaftaran, login admin, verifikasi Super Admin, submit bukti transfer, validasi WhatsApp, scan OCR, upload Supabase, review struk, approve, reject, dan replace struk.

Periksa log melalui:

```text
Vercel → Deployments → Functions
Vercel OCR → Logs
```

## 9. Pemindahan custom domain

Jangan mengubah DNS sebelum deployment Vercel berhasil. Setelah Vercel stabil:

1. Tambahkan custom domain ke Vercel.
2. Salin record DNS dari Vercel.
3. Perbarui DNS domain.
4. Tunggu propagasi.
5. Uji HTTPS dan seluruh fitur.
6. Lepaskan domain lama dari Railway setelah semuanya terverifikasi.

## 10. Finalisasi Git

```powershell
git switch main
git pull --ff-only origin main
git switch -c chore/migrate-to-pusaka-jeumala
```

Commit perubahan link organization, push branch, lalu buat Pull Request ke `main`.

## Checklist keputusan

- [ ] Nama repository tetap `PusakaFC26`.
- [x] OCR dipindahkan ke Vercel.
- [x] WAHA dihapus dari project.
- [x] PostgreSQL dipindahkan ke Supabase.
- [ ] Supabase tetap digunakan untuk storage struk.
- [ ] Next.js dipindahkan ke Vercel organization `pusakajeumala`.
- [ ] Custom domain dipindahkan ke Vercel setelah deployment terverifikasi.
