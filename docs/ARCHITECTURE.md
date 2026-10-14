# ARCHITECTURE.md — PusakaFC26

Dokumen ini menggambarkan arsitektur yang berjalan pada 14 Oktober 2026.

## 1. Topologi deployment

```text
Pengguna / Admin / Bendahara / Super Admin
                    │
                    ▼
        Next.js App Router + API → Vercel
             │          │          │
             │          │          └── Supabase Storage (receipts/*.webp)
             │          └───────────── FastAPI OCR → Vercel
             └──────────────────────── PostgreSQL → Supabase
```

- Next.js adalah aplikasi utama, UI sekaligus API orchestrator.
- FastAPI OCR adalah service terpisah pada project Vercel `pusakafc26-ocr`.
- Database production menggunakan PostgreSQL Supabase. SQLite tetap digunakan untuk pengembangan lokal.
- WAHA tidak lagi digunakan. Penolakan struk membuka tautan WhatsApp click-to-chat yang dikirim manual oleh reviewer.

## 2. Komponen utama

```text
src/app/                         Halaman dan API routes Next.js
src/components/jeumala/          Form publik, sidebar, receipt submission
src/components/jeumala/admin/    Dashboard admin dan ReceiptReview
src/lib/auth.ts                  Session Admin/Super Admin dan rate limit
src/lib/receipt-service.ts       OCR, pHash, WebP, Supabase Storage, PaymentReceipt
src/lib/database.ts              Prisma client singleton
prisma/schema.prisma             Registrant, PaymentReceipt, dan enum terkait
services/receipt-ocr/            FastAPI endpoint /scan dan Dockerfile
```

## 3. Database

Model utama:

- `Registrant`: data pendaftar jersey, nomor urut berdasarkan waktu submit, nomor punggung sebagai field terpisah.
- `PaymentReceipt`: satu row per registrant; submit ulang melakukan overwrite pada row yang sama.
- `PaymentStatus`: `PENDING_VERIFICATION`, `VERIFIED`, dan `REJECTED`.

Auto-reject karena scan gagal atau duplikat pHash tidak membuat row database. Reject oleh reviewer menghapus row `PaymentReceipt` dan file WebP terkait dari Supabase Storage.

## 4. API utama

| Route | Method | Fungsi | Akses |
|---|---|---|---|
| `/api/orders` | GET/POST | Membaca nomor terpakai dan membuat pendaftar | Publik |
| `/api/admin/orders` | GET | Statistik dan tabel admin | Admin/Super Admin |
| `/api/admin/import` | POST | Import backup JSON | Super Admin |
| `/api/admin/export` | GET | Export `.xlsx`/`.json` | Super Admin |
| `/api/receipts/submit` | POST | Scan dan simpan bukti transfer | Publik |
| `/api/receipts/pending` | GET | Daftar pending verification | Bendahara/Super Admin |
| `/api/receipts/:id/approve` | POST | Menyetujui bukti transfer | Bendahara/Super Admin |
| `/api/receipts/:id/reject` | POST | Menghapus receipt dan mengembalikan nomor WhatsApp | Bendahara/Super Admin |
| `/api/receipts/:id/replace` | POST | Mengganti receipt melalui pipeline scan | Super Admin |

## 5. Alur submit bukti transfer

1. Client mengirim `registrantId`, nomor WhatsApp, dan gambar.
2. Next.js memanggil OCR service `POST /scan` melalui `OCR_SERVICE_URL`.
3. Jika scan gagal atau pHash terdeteksi duplikat, request berhenti tanpa penulisan database.
4. Gambar dikonversi ke WebP.
5. File diunggah ke bucket Supabase Storage.
6. `PaymentReceipt` dibuat atau di-upsert dengan status `PENDING_VERIFICATION`.

Approval tidak mengirim notifikasi. Rejection membuka WhatsApp secara manual menggunakan nomor yang dikembalikan API.

## 6. FastAPI OCR

Endpoint `POST /scan` menerima multipart field `file` dan mengembalikan minimal:

```json
{
  "status": "success",
  "receiptHash": "8b0f2797b598d0d8",
  "scanMethod": "gemini"
}
```

Service menggunakan `GEMINI_API_KEY` dan model yang dikonfigurasi melalui `GEMINI_MODEL`. Model production yang telah diuji adalah `gemini-3.5-flash-lite`.

## 7. Environment production

Next.js/Vercel membutuhkan:

```env
DATABASE_URL=...
ADMIN_PASSWORD=...
ADMIN_SESSION_SECRET=...
SUPER_ADMIN_PASSWORD=...
OCR_SERVICE_URL=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=receipts
```

OCR service/Vercel membutuhkan:

```env
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.5-flash-lite
```

Secret hanya boleh berada di environment server, bukan variable `NEXT_PUBLIC_*`.

## 8. Verifikasi deployment

- Jalankan migration Prisma pada database Supabase.
- Uji `/api/orders`, login `/admin`, import/export, pagination, submit receipt, review, approve, reject, dan replace.
- Uji `GET /health` dan `POST /scan` pada OCR service.
- Periksa Supabase Storage memastikan hanya file `.webp` yang disimpan.
