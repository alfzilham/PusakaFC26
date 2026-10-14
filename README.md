# PusakaFC26

Aplikasi web pendaftaran jersey PusakaFC26. Aplikasi ini menyediakan formulir pendaftaran publik, daftar nomor punggung yang sudah digunakan, dan panel admin untuk mengelola data pendaftaran.

Repository: https://github.com/pusakajeumala26/PusakaFC26

![PusakaFC26 banner](public/assets/banner/pusakafc26-banner.jpg)

## Fitur

- Form pendaftaran jersey dengan validasi nama, nomor, ukuran, jenis kelamin, dan panjang lengan.
- Pemeriksaan duplikasi nama belakang dan nomor punggung di sisi client serta server.
- Daftar nomor punggung terpakai yang dapat dilihat publik.
- Panel admin dengan login berbasis password, rate limiting, statistik, edit/hapus data, dan ekspor.
- Panel admin menampilkan nomor urut berdasarkan waktu submit dan nomor punggung sebagai field terpisah.
- Panel admin menyediakan import data JSON, pagination 20 data per halaman, dan tombol Review Struk di area aksi data.
- Fitur Struk Submission Scanner untuk upload langsung dan review bukti transfer oleh Bendahara atau Super Admin.
- Status bukti transfer ditampilkan melalui warna baris data tanpa menambahkan kolom status baru.
- Sidebar publik menyediakan kontak Admin, Bendahara, Sekretaris, dan Super Admin.
- API Next.js untuk orders dan operasi admin.
- Prisma ORM dengan SQLite untuk pengembangan lokal dan PostgreSQL/Supabase untuk production.
- UI mobile-first menggunakan Tailwind CSS, Radix UI, Lucide React, dan Framer Motion.

## Teknologi

- Next.js 16 dan React 19
- TypeScript
- Prisma 6
- SQLite lokal melalui `DATABASE_URL`
- Tailwind CSS 4
- Zod untuk validasi
- Bun sebagai package manager/runtime yang direkomendasikan

## Prasyarat

- Node.js 20+ atau Bun 1.3+
- Database SQLite lokal atau database yang kompatibel dengan konfigurasi Prisma

## Menjalankan secara lokal

1. Install dependency:

   ```bash
   bun install
   ```

2. Buat file `.env`:

   ```env
   DATABASE_URL="file:./db/custom.db"
   ADMIN_PASSWORD="ganti-dengan-password-kuat"
   ADMIN_SESSION_SECRET="ganti-dengan-secret-kuat"
   ```

3. Generate client dan sinkronkan schema:

   ```bash
   bun run db:generate
   bun run db:push
   ```

4. Jalankan development server:

   ```bash
   bun run dev
   ```

   Aplikasi tersedia di `http://localhost:3000`.

## Perintah yang tersedia

| Perintah | Kegunaan |
| --- | --- |
| `bun run dev` | Menjalankan development server |
| `bun run build` | Membuat production build standalone |
| `bun run start` | Menjalankan production server |
| `bun run lint` | Menjalankan ESLint |
| `bun run db:generate` | Generate Prisma Client |
| `bun run db:push` | Sinkronisasi schema ke database |
| `bun run db:normalize:names` | Menormalkan nama lengkap lama tanpa menghapus data |
| `bun run db:migrate` | Membuat dan menjalankan migration Prisma |
| `bun run db:reset` | Reset database lokal |

## Dokumentasi Admin

Panduan fungsi panel Admin, Super Admin, import JSON, Review Struk, status bukti transfer, dan pagination tersedia di [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md).

## Struktur penting

```text
src/app/                 Halaman, layout, dan API routes Next.js
src/components/          Komponen UI dan komponen domain PusakaFC26
src/lib/                 Database, autentikasi, konstanta, dan validasi
prisma/schema.prisma     Schema database
public/                  Asset publik
docs/                    Spesifikasi, desain, konteks, dan arsitektur
examples/websocket/      Contoh server dan frontend WebSocket
```

## Catatan keamanan

- Jangan commit `.env`, password admin, session secret, atau database lokal.
- Ganti secret dan password bawaan sebelum deployment.
- Endpoint admin mengandalkan cookie HTTP-only dan validasi session server-side.
- Untuk deployment, sesuaikan `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, dan `SUPABASE_STORAGE_BUCKET` dengan environment production.
- Jangan menaruh service-role key Supabase pada kode client atau environment variable yang diawali `NEXT_PUBLIC_`.

## Lisensi

Hak cipta © 2026 Alfiz Ilham. Proyek ini menggunakan lisensi All Rights Reserved. Lihat [LICENSE](LICENSE).
