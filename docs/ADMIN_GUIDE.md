# Panduan Panel Admin PusakaFC26

Dokumen ini menjelaskan fungsi panel Admin, Super Admin, serta alur review bukti transfer pada versi terbaru PusakaFC26.

## Akses dan hak pengguna

- **Admin** dapat melihat data pendaftar secara read-only.
- **Bendahara** dan **Super Admin** dapat membuka halaman Review Struk untuk memeriksa bukti transfer.
- **Super Admin** diperlukan untuk export, import JSON, edit, hapus, replace bukti transfer, dan penggunaan nomor punggung duplikat.
- Data pendaftar tidak dihapus ketika halaman di-refresh atau ketika berpindah halaman.

## Tombol aksi data

Pada sidebar Admin tersedia:

- **Refresh** untuk memuat ulang data.
- **Export .xlsx** untuk mengunduh data dalam format Excel.
- **Export .json** untuk mengunduh backup data JSON.
- **Import JSON** untuk memasukkan kembali data dari backup JSON. Aksi ini memerlukan verifikasi Super Admin.
- **Review Struk** untuk membuka daftar bukti transfer yang menunggu verifikasi.
- **Struk Generator** untuk membuat receipt cash/manual yang langsung berstatus terverifikasi.
- **Keluar** untuk mengakhiri sesi Admin.

Tombol **Refresh** tetap berada di top bar halaman Data Pendaftar.

## Pagination dan pencarian

Tabel menampilkan maksimal 20 data per halaman. Gunakan tombol panah di bagian bawah tabel untuk berpindah halaman. Pencarian berdasarkan nama, nama belakang, atau nomor punggung akan kembali ke halaman pertama secara terkontrol; perpindahan ke halaman berikutnya tidak lagi di-reset oleh request tabel duplikat.

## Urutan dan status pembayaran

- Tabel Admin dan halaman Status Pembayaran memakai urutan yang sama: waktu submit terbaru berada di atas, dengan `id` sebagai tie-breaker.
- Nomor urut dihitung dari waktu submit paling awal dan tetap stabil meskipun tampilan sedang difilter.
- Hijau berarti `VERIFIED`, kuning berarti `PENDING_VERIFICATION`, merah berarti `REJECTED`, dan putih berarti belum ada receipt.
- Filter status pada halaman publik hanya menyaring data; urutan asli tidak berubah.

## Review bukti transfer

Alur review:

1. Peserta mengirim nama, nomor WhatsApp, dan foto struk.
2. Sistem memvalidasi nomor WhatsApp, mengonversi gambar ke WebP, lalu langsung menyimpan bukti ke Supabase Storage dan database dengan status Pending Verification.
3. Bendahara atau Super Admin memeriksa daftar **Pending Verification**.
4. **Approve** mengubah status menjadi disetujui tanpa mengirim notifikasi.
5. **Reject** menghapus data bukti transfer dan file gambarnya dari database serta Supabase Storage. Rejection dapat dilanjutkan dengan notifikasi manual sesuai alur aplikasi.

Status bukti transfer ditampilkan melalui warna baris data pendaftar; tidak ada kolom status tambahan pada tabel.

## Struk cash/manual Bendahara

1. Bendahara memilih pendaftar pada Struk Generator.
2. Bendahara mengisi nomor WhatsApp, nominal, dan catatan opsional.
3. Sistem membuat gambar receipt, menyimpannya sebagai `TreasurerReceipt`, dan menautkannya ke pendaftar.
4. Sistem membuat atau memperbarui `PaymentReceipt` dengan status `VERIFIED`, sehingga baris pendaftar langsung berwarna hijau.
5. Jika pendaftar dihapus oleh Super Admin, receipt database dan file receipt terkait ikut dibersihkan.

## Environment production

Pastikan environment production memiliki konfigurasi berikut:

```env
DATABASE_URL=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=receipts
```

`SUPABASE_SERVICE_ROLE_KEY` bersifat rahasia dan hanya boleh digunakan di server.
