# Arsitektur PusakaFC26

## Komponen produksi

```text
Browser → Next.js/Vercel → Supabase PostgreSQL
                       └→ Supabase Storage
```

Aplikasi tidak menggunakan WAHA, OCR, Gemini, atau service backend terpisah.

## Alur Struk Scanner

1. User mengirim nama pendaftar, nomor WhatsApp, dan file gambar.
2. API memvalidasi pendaftar, nomor, tipe file, dan batas 10 MB.
3. API mengonversi gambar menjadi WebP dan mengunggahnya ke bucket `receipts`.
4. API melakukan upsert satu `PaymentReceipt` per pendaftar dengan status pending.
5. Bendahara/Super Admin memeriksa bukti secara manual dan memilih approve atau reject.

`receiptHash` adalah fingerprint SHA-256 untuk metadata saja. Tidak ada deteksi atau pemblokiran duplikat otomatis.

## Environment produksi

```env
DATABASE_URL=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=receipts
```
