# SPEC.md — Struk Scanner

## Model data

`PaymentReceipt` berelasi one-to-one dengan `JerseyOrder` melalui `registrantId` yang unik.

```prisma
enum PaymentStatus {
  PENDING_VERIFICATION
  VERIFIED
  REJECTED
}

model PaymentReceipt {
  id            String        @id @default(cuid())
  registrantId  String        @unique
  phoneNumber   String
  phoneVerified Boolean       @default(false)
  imageUrl      String
  receiptHash   String
  status        PaymentStatus @default(PENDING_VERIFICATION)
  reviewedBy    String?
  reviewedAt    DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}
```

`receiptHash` adalah fingerprint SHA-256 lokal untuk metadata. Tidak ada pHash, perbandingan hash, atau blokir duplikat.

## Kontrak submit

`POST /api/receipts/submit` menerima multipart fields `registrantId`, `phoneNumber`, dan `receiptImage`.

Urutan server: validasi input → baca bytes → konversi WebP → upload Supabase → upsert PaymentReceipt pending. Kegagalan upload/database tidak membuat submission dianggap berhasil.

`POST /api/receipts/:id/replace` menjalankan pipeline yang sama dan hanya tersedia untuk Super Admin.

## Review

`GET /api/receipts/pending` hanya dapat digunakan Bendahara/Super Admin. Approve mengubah status menjadi `VERIFIED`. Reject menghapus row dan object Storage lalu menyediakan alur notifikasi manual.

## Batas file

Tipe yang diterima: `image/jpeg`, `image/png`, `image/webp`. Ukuran maksimal 10 MB. Gambar tidak dinilai isi, nominal, atau kemiripannya secara otomatis.

## Storage

Object disimpan sebagai `receipts/<registrantId>-<uuid>.webp` pada bucket Supabase `receipts`. URL publik disimpan pada `imageUrl`.
