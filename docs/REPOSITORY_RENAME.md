# Repository Rename: PusakaFC26

Repository project ini sekarang menggunakan nama:

```text
https://github.com/alfzilham/PusakaFC26
```

## Local clone

Perbarui remote pada clone lokal:

```powershell
git remote set-url origin https://github.com/alfzilham/PusakaFC26.git
git remote -v
```

## Railway

Rename repository tidak otomatis mengganti domain Railway. Setelah hostname Railway baru dibuat, periksa tiga bagian berikut:

1. Source repository pada service Railway tetap menunjuk ke repository yang sama.
2. Custom domain Railway menggunakan target yang baru dan sudah memiliki record DNS sesuai instruksi Railway.
3. Link deployment dan environment variable aplikasi tetap berada pada service yang benar.

## Release links

Link issue, pull request, tag, dan release GitHub lama diarahkan ke repository baru oleh GitHub. Link yang ditulis langsung di source code atau dokumentasi harus diperbarui secara manual.
