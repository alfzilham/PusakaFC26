# PRD.md — Struk Scanner

## Tujuan

Menyediakan alur upload bukti transfer yang sederhana dan menempatkan keputusan verifikasi sepenuhnya pada Bendahara.

## Alur pengguna

1. Pengguna memilih Nama Lengkap dari data pendaftar.
2. Pengguna mengisi nomor HP/WhatsApp dan memilih gambar struk.
3. Setelah submit, server memvalidasi data dasar, mengonversi gambar ke WebP, menyimpan file, dan membuat atau memperbarui `PaymentReceipt` berstatus `PENDING_VERIFICATION`.
4. Bendahara atau Super Admin membuka Review Struk dan memilih Approve atau Reject.

Tidak ada auto-reject karena OCR, Gemini, nominal, atau kemiripan gambar. Gambar valid secara format tetap dikirim ke antrean review agar keputusan dilakukan manusia.

## Status tampilan

| Status | Warna | Makna |
| --- | --- | --- |
| Pending Verification | Kuning | Menunggu review Bendahara |
| Verified | Hijau | Disetujui |
| Rejected | Merah | Ditolak |

Status ditampilkan melalui warna baris data pendaftar tanpa kolom status tambahan.

## Aturan bisnis

- Satu registrant memiliki satu row `PaymentReceipt`.
- Submit ulang meng-overwrite row yang sama dan mengembalikan status ke pending.
- Reject menghapus row dan file gambar terkait dari Supabase Storage.
- Approve tidak mengirim notifikasi otomatis.
- Tidak ada pemeriksaan duplikat otomatis.
- Super Admin dapat mengganti file dari halaman review.
