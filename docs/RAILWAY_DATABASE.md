# Railway Database Configuration

Service aplikasi harus memakai URL dari service PostgreSQL Railway.

Pada Railway, buka service aplikasi `jeumalacup26` → **Variables**, lalu set:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

Ganti `Postgres` jika nama service database Anda berbeda. Nilai tersebut harus berupa URL PostgreSQL lengkap yang diawali `postgresql://` atau `postgres://`.

## Verifikasi

1. Simpan variable dan redeploy service aplikasi.
2. Buka log deployment dan pastikan tidak ada pesan `Database railwaypostgresql: does not exist`.
3. Buka halaman utama dan `/admin`.
4. Jalankan `bunx prisma db push --accept-data-loss` melalui Railway Console satu kali jika tabel belum dibuat.

Jika database belum terhubung, API akan mengembalikan status `503` dengan kode `DATABASE_UNAVAILABLE` agar masalah konfigurasi dapat dibedakan dari password admin yang salah.
