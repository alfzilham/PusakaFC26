# Railway Database Configuration

Service aplikasi harus memakai URL dari service PostgreSQL Railway.

Pada Railway, buka service aplikasi PusakaFC26 → **Variables**, lalu set:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

Ganti `Postgres` jika nama service database Anda berbeda. Nilai tersebut harus berupa URL PostgreSQL lengkap yang diawali `postgresql://` atau `postgres://`.

## Verifikasi

1. Simpan variable dan redeploy service aplikasi.
2. Buka log deployment dan pastikan tidak ada pesan `Database railwaypostgresql: does not exist`.
3. Buka halaman utama dan `/admin`.
4. Sinkronisasi schema production dijalankan otomatis oleh `bun run start` melalui `prisma db push --skip-generate` sebelum server Next.js dimulai. Mode ini dipakai agar database existing tidak gagal dengan Prisma `P3005` saat baseline migration belum tersedia.
5. Setelah deploy, periksa log Railway dan pastikan schema berhasil disinkronkan serta tidak ada error Prisma `P2021` atau `P3005`.

Jika database belum terhubung, API akan mengembalikan status `503` dengan kode `DATABASE_UNAVAILABLE` agar masalah konfigurasi dapat dibedakan dari password admin yang salah.
