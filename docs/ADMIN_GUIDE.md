# Panduan Panel Admin PusakaFC26

Dokumen ini menjelaskan fungsi panel Admin, Super Admin, serta alur review bukti transfer pada versi terbaru PusakaFC26.

## Akses dan hak pengguna

- **Admin** dapat melihat data pendaftar secara read-only.
- **Bendahara** dan **Super Admin** dapat membuka halaman Review Struk untuk memeriksa bukti transfer.
- **Super Admin** diperlukan untuk export, import JSON, edit, hapus, replace bukti transfer, dan penggunaan nomor punggung duplikat.
- Data pendaftar tidak dihapus ketika halaman di-refresh atau ketika berpindah halaman.

## Tombol aksi data

Pada area aksi di atas tabel Data Pendaftar tersedia:

- **Refresh** untuk memuat ulang data.
- **Export .xlsx** untuk mengunduh data dalam format Excel.
- **Export .json** untuk mengunduh backup data JSON.
- **Import JSON** untuk memasukkan kembali data dari backup JSON. Aksi ini memerlukan verifikasi Super Admin.
- **Review Struk** untuk membuka daftar bukti transfer yang menunggu verifikasi. Tombol ini berada di sebelah Import JSON.
- **Generator Struk Bendahara** untuk membuat, menyimpan, mengunduh, dan membagikan gambar bukti pembayaran.

Menu aksi Export, Import, Review Struk, Generator Struk Bendahara, dan Keluar tersedia di sidebar Admin. Tombol Refresh tetap berada di area tabel Data Pendaftar.

## Pagination dan pencarian

Tabel menampilkan maksimal 20 data per halaman. Gunakan tombol panah di bagian bawah tabel untuk berpindah halaman. Pencarian berdasarkan nama, nama belakang, atau nomor punggung akan kembali ke halaman pertama secara terkontrol; perpindahan ke halaman berikutnya tidak lagi di-reset oleh request tabel duplikat.

## Review bukti transfer

Alur review:

1. Peserta mengirim nama, nomor WhatsApp, dan foto struk.
2. Sistem memvalidasi nomor WhatsApp, memindai struk melalui OCR/Gemini, lalu menyimpan gambar WebP ke Supabase Storage.
3. Bendahara atau Super Admin memeriksa daftar **Pending Verification**.
4. **Approve** mengubah status menjadi disetujui tanpa mengirim notifikasi.
5. **Reject** menghapus data bukti transfer dan file gambarnya dari database serta Supabase Storage. Rejection dapat dilanjutkan dengan notifikasi manual sesuai alur aplikasi.

Status bukti transfer ditampilkan melalui warna baris data pendaftar; tidak ada kolom status tambahan pada tabel.

## Environment production

Pastikan environment production memiliki konfigurasi berikut:

```env
DATABASE_URL=...
OCR_SERVICE_URL=...
GEMINI_API_KEY=...
GEMINI_MODEL=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=receipts
```

`SUPABASE_SERVICE_ROLE_KEY` bersifat rahasia dan hanya boleh digunakan di server.
