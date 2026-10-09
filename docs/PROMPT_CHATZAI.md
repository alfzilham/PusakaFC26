Buatkan saya aplikasi web full-stack bernama "PusakaFC26" — sistem pendaftaran nama/nomor punggung jersey bola, tanpa login page untuk user publik, dengan panel admin terproteksi.

STACK:
- Next.js (App Router) full-stack
- Prisma ORM + PostgreSQL
- Deploy target: Railway
- Font: Plus Jakarta Sans
- Icon: Lucide React (CDN/package) — jangan pakai emoji sama sekali
- Styling: CSS custom, bukan library komponen pihak ketiga untuk dropdown/checkbox/scrollbar

ALUR UTAMA:
1. Splash screen: logo animasi scale 0.3→1 + fade in (~800ms), lalu fade out ke halaman utama.
2. Skeleton loader (shimmer, minimum tampil 400ms) saat fetch data awal.
3. Tampilkan Halaman 1 (form).

HALAMAN 1 — "Form Pendaftaran Jersey":
Field (urut dari atas):
1. Gender — dropdown custom, required (Pria/Wanita)
2. Nama Lengkap — text, required, min 3 karakter
3. Nama Belakang baju — text, required, 2-20 karakter, alfanumerik+spasi, UNIK GLOBAL (lintas gender)
4. No. Belakang baju — number, required, integer 1-999, UNIK GLOBAL (lintas gender)
5. Ukuran — dropdown custom, required (S, M, L, XL, XXL, XXXL)
6. Panjang/Pendek Lengan — dropdown custom, required (hanya 2 opsi: Panjang/Pendek)
7. Tombol Submit — disabled jika ada field invalid/kosong atau sedang loading (spinner), mencegah double-submit

Validasi duplikat (Nama Belakang & No. Belakang):
- Fetch semua data terpakai sekali saat page load, simpan di state client, validasi real-time saat user mengetik (TANPA request per-keystroke).
- Validasi ulang wajib di server saat submit (Prisma unique constraint + explicit check) untuk race condition.
- Setelah submit sukses: refetch data cache, tampilkan toast sukses (slide-in dari atas, auto-dismiss 3 detik), form reset otomatis tetap di Halaman 1.
- User TIDAK BISA edit/cancel submission sendiri — arahkan ke kontak WhatsApp admin jika perlu koreksi.

HALAMAN 2 — "Nomor Punggung Terpakai":
- Satu daftar gabungan nomor terpakai (bukan tab terpisah), tiap item disertai badge/label gender (bukan hanya warna, sertakan teks).
- Read-only untuk publik.

TOP BAR (semua halaman, sticky):
[ Logo ] [ PusakaFC26 ]                    [ Hamburger menu ]

SIDEBAR (dibuka via hamburger):
1. Logo + "PusakaFC26" di bagian atas
2. Link ke Halaman 1
3. Link ke Halaman 2
4. "Lihat Detail Data" — tampil dengan ikon lock, DISABLED/tidak bisa diklik untuk publik (hanya admin, diakses via path /admin terpisah)
5. "Information" (posisi sticky seperti tombol settings), berisi submenu:
   - About
   - Privacy Policy
   - Terms of Services
   - Developer Contact: Nama "Alfiz Ilham", No. WA "0852-1389-6460"

ADMIN PANEL (path /admin, TIDAK ada link publik ke sini dari sidebar):
- Login password-based, rate limiting: 5x gagal → lock 15 menit (catat per IP)
- Dashboard: 3 summary cards (Total Entri, Total Pria, Total Wanita)
- Export data: tombol .xlsx (2 sheet terpisah: "Pria" dan "Wanita") dan .json
- Tabel data: search bar (nama/nama belakang/nomor) + filter gender (custom checkbox/dropdown) + pagination 20/halaman
- Row actions: Edit (inline/modal, langsung tersimpan tanpa konfirmasi tambahan), Hapus (WAJIB modal konfirmasi sebelum eksekusi)

DATABASE SCHEMA (Prisma):
```prisma
enum Gender { PRIA WANITA }
enum SleeveType { PANJANG PENDEK }
enum Size { S M L XL XXL XXXL }

model JerseyOrder {
  id         String     @id @default(cuid())
  gender     Gender
  fullName   String
  backName   String     @unique
  backNumber Int        @unique
  size       Size
  sleeve     SleeveType
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
}

model AdminLoginAttempt {
  id        String   @id @default(cuid())
  ip        String
  success   Boolean
  createdAt DateTime @default(now())
  @@index([ip, createdAt])
}
```

KOMPONEN CUSTOM WAJIB (semua dengan animasi smooth):
- CustomDropdown: fade+scale animation (150-200ms), keyboard nav (↑↓ Enter Esc), ARIA role="listbox"
- CustomCheckbox: animasi check smooth (~150ms), focus-visible jelas
- Custom scrollbar: ::-webkit-scrollbar + scrollbar-width fallback Firefox

DESAIN:
- Clean minimalism, mobile-first (desain dari breakpoint mobile dulu, lalu scale up)
- Accessibility: ARIA labels, keyboard navigation lengkap, kontras warna WCAG AA, aria-live untuk toast/error
- Warna: palet netral + satu warna accent brand, badge gender 2 warna berbeda + selalu sertai teks label

Tolong bangun seluruh struktur project (folder, komponen, API routes, Prisma schema, migration-ready) sesuai spesifikasi di atas, siap untuk deploy ke Railway.
