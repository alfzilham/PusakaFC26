# Fitur: Generator Struk Bendahara

## 1. Ringkasan

Fitur ini hanya dapat diakses oleh role **Bendahara**. Bendahara mengisi data
pembayaran seorang user melalui form, lalu sistem meng-generate data tersebut
menjadi sebuah **gambar struk**. Gambar struk otomatis tersimpan ke database,
dan bendahara dapat langsung mengunduhnya atau membagikannya via WhatsApp.

## 2. Diagram Alur

![Workflow Generator Struk](./workflow.png)

## 3. Alur Proses (Step by Step)

1. **Bendahara membuka form input** (akses dibatasi: hanya role `bendahara`).
2. Bendahara mengisi field:
   - `nama_lengkap` (string, wajib)
   - `no_hp` (string, wajib, format nomor HP/WA)
   - `nominal` (number/currency, wajib)
   - `note` (string, opsional)
3. Bendahara menekan tombol **Submit**.
4. Sistem melakukan render data form menjadi **gambar struk** (image), berisi:
   - Nama lengkap
   - No. HP/WA
   - Nominal (format Rupiah)
   - Note
   - Timestamp transaksi
5. Gambar struk yang dihasilkan:
   - **Disimpan ke database** sebagai riwayat/histori struk milik user tersebut.
   - **Ditampilkan ke bendahara** dengan 2 opsi aksi:
     - **Download** — unduh file gambar struk ke perangkat.
     - **WhatsApp** — buka share sheet / wa.me link untuk mengirim gambar struk.

## 4. Data Model (usulan)

```
Struk
├─ id              : UUID / autoincrement
├─ nama_lengkap     : string
├─ no_hp            : string
├─ nominal          : integer (simpan dalam satuan terkecil / rupiah)
├─ note             : string (nullable)
├─ image_url        : string (path/URL hasil render)
├─ created_by       : FK -> User (bendahara yang submit)
├─ created_at       : datetime
└─ updated_at       : datetime
```

## 5. Komponen yang Perlu Dibangun

| Komponen | Deskripsi |
|---|---|
| `StrukFormPage` | Halaman form input (proteksi role bendahara) |
| `StrukFormValidation` | Validasi input (nama, no HP, nominal wajib & format) |
| `generateStrukImage()` | Fungsi render data → gambar (HTML-to-image / Canvas / server-side image generation) |
| `StrukResultPage` | Halaman hasil, preview gambar struk + tombol Download & WhatsApp |
| `StrukRepository` | Simpan & ambil data struk dari database |
| `AuthGuard(bendahara)` | Middleware/guard pembatas akses role |

## 6. Rekomendasi Teknis untuk Implementasi

- **Generate gambar struk**: gunakan library HTML-to-image di sisi client
  (mis. `html-to-image` atau `html2canvas`) agar desain struk (HTML/CSS) bisa
  langsung dikonversi ke PNG tanpa butuh service render terpisah. Alternatif:
  render server-side (mis. `@vercel/og`, `puppeteer`, atau `sharp` + template)
  jika gambar perlu konsisten di semua device atau untuk watermark/keamanan.
- **Simpan gambar**: upload hasil image ke storage (lokal/S3/Supabase
  Storage/dsb.), simpan `image_url` di database, bukan binary langsung
  di tabel.
- **Download**: trigger `<a download>` dari blob/URL gambar hasil generate.
- **Share ke WhatsApp**: gunakan `wa.me` link (`https://wa.me/?text=...`)
  untuk teks, atau native Web Share API (`navigator.share`) dengan file
  attachment jika target browser mendukung (mobile browser modern umumnya
  support file sharing lewat Web Share API Level 2).
- **Proteksi akses**: pastikan route/halaman form hanya bisa diakses oleh
  user dengan role `bendahara` (role-based access control di middleware
  / route guard).
- **Format nominal**: tampilkan dalam format Rupiah (`Rp 150.000`) di
  struk, simpan nilai numerik mentah di database.

## 7. Referensi Desain UI

Desain UI (form input & hasil struk) sudah tersedia sebagai referensi visual
sebelum implementasi — minta ke tim/owner task jika diperlukan sebagai acuan
tampilan (warna, layout, komponen).
