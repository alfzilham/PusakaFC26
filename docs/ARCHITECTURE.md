# ARCHITECTURE.md — PusakaFC26

## 1. Stack

- **Framework**: Next.js (App Router), full-stack — frontend + API routes dalam satu project.
- **Database**: PostgreSQL.
- **ORM**: Prisma.
- **Deployment**: Railway.
- **Styling**: CSS custom (bukan library UI pihak ketiga untuk komponen interaktif — dropdown/checkbox/scrollbar dibuat manual sesuai kriteria wajib).
- **Icons**: Lucide React.
- **Font**: Plus Jakarta Sans (Google Fonts / self-hosted via `next/font`).

## 2. Folder Structure (disarankan)

```
/app
  /page.tsx                 → Halaman 1 (Form Pendaftaran)
  /used-numbers/page.tsx    → Halaman 2 (Nomor Terpakai)
  /admin
    /page.tsx               → Login admin
    /dashboard/page.tsx     → Dashboard admin (protected)
  /api
    /orders
      route.ts              → GET (list terpakai) POST (submit order)
      /[id]/route.ts        → PATCH (edit) DELETE (hapus) — super admin only
    /admin
      /login/route.ts       → POST login + rate limit check
      /export/route.ts      → GET export .xlsx / .json
/components
  /ui
    CustomDropdown.tsx
    CustomCheckbox.tsx
    Toast.tsx
    SkeletonLoader.tsx
    SplashScreen.tsx
  /layout
    TopBar.tsx
    Sidebar.tsx
  /forms
    JerseyOrderForm.tsx
  /admin
    DataTable.tsx
    SummaryCards.tsx
    EditModal.tsx
    DeleteConfirmModal.tsx
  /lib
  prisma.ts                 → Prisma client singleton
  validation.ts             → Zod schema validasi field
  rateLimit.ts               → logic rate limiting login admin
  auth.ts                    → session/cookie admin + super admin
/prisma
  schema.prisma
```

## 3. Database Schema (Prisma)

```prisma
enum Gender {
  PRIA
  WANITA
}

enum SleeveType {
  PANJANG
  PENDEK
}

enum Size {
  S
  M
  L
  XL
  XXL
  XXXL
}

model JerseyOrder {
  id         String     @id @default(cuid())
  gender     Gender
  fullName   String
  backName   String     @unique
  backNumber Int
  size       Size
  sleeve     SleeveType
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
}

model AdminLoginAttempt {
  id        String   @id @default(cuid())
  ip        String
  success   Boolean
  createdAt DateTime @default(now())

  @@index([ip, createdAt])
}
```

## 4. API Routes

| Route | Method | Fungsi | Auth |
|---|---|---|---|
| `/api/orders` | GET | Ambil semua `backName` + `backNumber` + `gender` terpakai (untuk cache client-side) | Public |
| `/api/orders` | POST | Submit order baru, validasi server-side ulang (unik global) | Public |
| `/api/orders/[id]` | PATCH | Edit entri | Super Admin |
| `/api/orders/[id]` | DELETE | Hapus entri | Super Admin |
| `/api/admin/login` | POST | Login admin, cek rate limit | Public (gated) |
| `/api/admin/export?format=xlsx\|json` | GET | Export data | Super Admin |

## 5. Validasi Duplikat — Alur Teknis

1. Saat Halaman 1 di-load: fetch `GET /api/orders` → simpan di state client (`usedNames: Set<string>`, `usedNumbers: Set<number>`).
2. Saat user mengetik di field Nama Belakang / No. Belakang: cek langsung terhadap Set di client → tampilkan error instan jika duplikat.
3. Saat submit: server re-validasi terhadap DB dengan explicit check untuk mencegah race condition. User dan admin biasa tetap wajib unik; super admin dapat memakai nomor duplikat melalui endpoint terproteksi.
4. Jika submit sukses: refetch `GET /api/orders` untuk update cache client.
5. Jika submit gagal karena duplikat (race condition): tampilkan error, minta user ganti nama/nomor.

## 6. Admin Authentication & Rate Limiting

- Password admin disimpan sebagai hash (bcrypt) di environment variable atau tabel admin sederhana.
- Session: HTTP-only cookie (signed) setelah login sukses.
- Rate limiting:
  - Tiap percobaan login dicatat ke `AdminLoginAttempt` (ip, success, createdAt).
  - Sebelum proses login: hitung jumlah `success: false` dalam 15 menit terakhir dari IP tersebut.
  - Jika ≥ 5 → tolak dengan pesan "Terlalu banyak percobaan, coba lagi dalam 15 menit."

## 7. Export Data

- **`.xlsx`**: generate dengan library seperti `exceljs` atau `xlsx` (SheetJS) di server (API route), 2 sheet: "Pria" dan "Wanita", masing-masing filter dari tabel `JerseyOrder`.
- **`.json`**: `JSON.stringify` seluruh data `JerseyOrder`, didownload sebagai file.

## 8. Role Admin dan Super Admin

- Admin dapat melihat statistik dan data secara read-only.
- Export, edit, hapus, dan nomor punggung duplikat membutuhkan verifikasi super admin.
- Password super admin disimpan pada environment variable `SUPER_ADMIN_PASSWORD`.

## 8. Deployment (Railway)

- Railway project dengan 2 service: Next.js app + PostgreSQL addon.
- Environment variables: `DATABASE_URL`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`.
- Build command: `prisma generate && next build`.
- Start command: `next start`.
- Sinkronisasi schema: `prisma db push --skip-generate` dijalankan sebelum server dimulai untuk mendukung database Railway existing tanpa baseline migration.

## 9. Animasi & Performance

- Splash screen: CSS transform `scale()` + `opacity`, durasi ~800ms, dikontrol via state di root layout (`useState` + `useEffect` timer).
- Skeleton loader: tampil minimum 400ms meski fetch lebih cepat (gunakan `Promise.all` dengan `setTimeout` minimum).
- Toast: posisi fixed top, animasi slide-in via CSS transition, auto-dismiss via `setTimeout` 3000ms.
