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
4. Migration production dijalankan otomatis oleh `bun run start` melalui `prisma migrate deploy` sebelum server Next.js dimulai.
5. Setelah deploy, periksa log Railway dan pastikan muncul pesan migration berhasil serta tidak ada error Prisma `P2021`.

Jika database belum terhubung, API akan mengembalikan status `503` dengan kode `DATABASE_UNAVAILABLE` agar masalah konfigurasi dapat dibedakan dari password admin yang salah.
