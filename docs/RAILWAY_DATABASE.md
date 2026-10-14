# Database Production Configuration

Dokumen ini menggantikan panduan database Railway lama. Database production PusakaFC26 sekarang menggunakan PostgreSQL Supabase, sedangkan Vercel menjalankan aplikasi Next.js.

## Environment Vercel

Set `DATABASE_URL` pada environment **Production** dan **Preview** menggunakan connection string PostgreSQL Supabase. Untuk Prisma migration dari komputer lokal, gunakan connection string pooler Supabase yang dapat dijangkau dari jaringan lokal.

```env
DATABASE_URL=<Supabase pooler connection string>
```

Jangan memasukkan password database ke repository atau membagikannya di log.

## Migration

Dari root project:

```powershell
$env:DATABASE_URL = Read-Host "Paste DATABASE_URL Supabase"
bunx prisma migrate deploy
bunx prisma migrate status
Remove-Item Env:DATABASE_URL
```

Jika koneksi langsung `db.*.supabase.co:5432` tidak dapat dijangkau, gunakan connection string pooler Supabase. Pastikan `Test-NetConnection` ke host dan port berhasil sebelum menjalankan migration.

## Verifikasi

1. Redeploy project Vercel setelah environment berubah.
2. Uji `https://DOMAIN/api/orders`.
3. Buka halaman utama dan `/admin`.
4. Pastikan data pendaftar, import JSON, pagination, dan Review Struk dapat dimuat.
5. Jika database gagal, API mengembalikan HTTP `503` dengan kode `DATABASE_UNAVAILABLE`.
