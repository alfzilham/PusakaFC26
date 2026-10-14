# CONTEXT.md — Struk Scanner

Struk Scanner memindahkan pengumpulan bukti transfer dari chat ke aplikasi PusakaFC26. Pengguna memilih pendaftar, mengisi nomor WhatsApp, dan mengunggah gambar struk.

Keputusan arsitektur final: tidak ada OCR atau Gemini. Sistem hanya memvalidasi format dasar file, mengonversi gambar ke WebP, menyimpannya ke Supabase, dan memasukkannya ke antrean review manual. Keabsahan struk, nominal, dan kemungkinan duplikat diputuskan Bendahara atau Super Admin.

Hosting produksi menggunakan Vercel untuk Next.js dan Supabase untuk PostgreSQL/Storage. WAHA juga tidak digunakan.

Satu registrant hanya memiliki satu `PaymentReceipt`; submit ulang meng-overwrite row tersebut. Rejection menghapus row dan file Storage terkait.
