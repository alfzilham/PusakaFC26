# ARCHITECTURE.md — Struk Scanner

## Topologi produksi

```text
Browser pengguna
      │ POST multipart
      ▼
Next.js API di Vercel
      ├─ validasi registrant, nomor WhatsApp, tipe, dan ukuran file
      ├─ konversi gambar ke WebP
      ├─ upload ke Supabase Storage
      └─ upsert PaymentReceipt ke Supabase PostgreSQL
                         │
                         ▼
             Review manual Bendahara/Super Admin
```

Tidak ada service OCR, Gemini, WAHA, queue, atau child process. Bukti yang lolos validasi file langsung masuk antrean review manusia.

## Alur submit

1. Browser mengirim `registrantId`, `phoneNumber`, dan `receiptImage` ke `POST /api/receipts/submit`.
2. Next.js memastikan pendaftar ada, nomor valid, file berupa JPG/PNG/WEBP, dan ukurannya maksimal 10 MB.
3. Gambar dikonversi ke WebP dan diunggah ke bucket Supabase `receipts`.
4. `PaymentReceipt` dibuat atau di-overwrite untuk registrant yang sama dengan status `PENDING_VERIFICATION`.
5. Bendahara atau Super Admin memutuskan approve/reject secara manual.

## API

| Route | Method | Fungsi | Akses |
| --- | --- | --- | --- |
| `/api/receipts/submit` | POST | Validasi, upload, dan simpan bukti | Publik |
| `/api/receipts/pending` | GET | Daftar bukti pending | Bendahara/Super Admin |
| `/api/receipts/:id/approve` | POST | Menyetujui bukti | Bendahara/Super Admin |
| `/api/receipts/:id/reject` | POST | Menolak dan menghapus bukti | Bendahara/Super Admin |
| `/api/receipts/:id/replace` | POST | Mengganti bukti | Super Admin |

## Penyimpanan

File WebP disimpan pada `receipts/<registrantId>-<uuid>.webp`. `receiptHash` berisi SHA-256 lokal untuk metadata/traceability saja; nilainya tidak dibandingkan dan tidak pernah memblokir submit duplikat.

Saat reject, row database dan object Storage dihapus. Saat submit ulang, row registrant yang sama di-overwrite.

## Environment produksi

```env
DATABASE_URL=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=receipts
```

OCR_SERVICE_URL, GEMINI_API_KEY, dan GEMINI_MODEL sudah tidak diperlukan dan harus dihapus dari deployment.
