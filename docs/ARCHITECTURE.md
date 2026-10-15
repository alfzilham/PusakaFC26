# Arsitektur PusakaFC26

## Komponen produksi

```text
Browser → Next.js/Vercel → Supabase PostgreSQL
                       └→ Supabase Storage
```

Aplikasi tidak menggunakan WAHA, OCR, Gemini, atau service backend terpisah.

## Alur receipt user

1. User mengirim nama pendaftar, nomor WhatsApp, dan file gambar.
2. API memvalidasi pendaftar, nomor, tipe file, dan batas 10 MB.
3. API mengonversi gambar menjadi WebP dan mengunggahnya ke bucket `receipts`.
4. API melakukan upsert satu `PaymentReceipt` per pendaftar dengan status pending.
5. Bendahara/Super Admin memeriksa bukti secara manual dan memilih approve atau reject.

`receiptHash` adalah fingerprint SHA-256 untuk metadata saja. Tidak ada deteksi atau pemblokiran duplikat otomatis.

## Alur receipt cash/manual

1. Bendahara memilih pendaftar dari dropdown searchable pada Struk Generator.
2. API membuat gambar receipt dan mengunggahnya ke Supabase Storage.
3. API menyimpan `TreasurerReceipt` dengan relasi `registrantId`.
4. API melakukan upsert `PaymentReceipt` berstatus `VERIFIED`, sehingga status publik dan Admin menjadi hijau.

## Sinkronisasi tabel

Tabel Admin dan Status Pembayaran memakai urutan canonical `createdAt DESC, id DESC`. Nomor urut diturunkan dari urutan kebalikan `createdAt ASC, id ASC` dan dikirim oleh API publik maupun API Admin.

## Penghapusan dan lifecycle file

Penghapusan `JerseyOrder` menghapus `PaymentReceipt` dan `TreasurerReceipt` melalui cascade database. Endpoint Admin juga menghapus URL gambar receipt terkait dari Supabase Storage. Saat receipt user diganti, file lama dibersihkan setelah receipt baru berhasil tersimpan.

## Environment produksi

```env
DATABASE_URL=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=receipts
```
