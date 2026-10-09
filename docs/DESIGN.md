# DESIGN.md — PusakaFC26

## 1. Design Principles

- Clean minimalism, mudah digunakan.
- Mobile-first — desain dan test di breakpoint mobile terlebih dahulu, lalu scale up ke tablet/desktop.
- Konsisten: satu sistem warna, satu font, satu set komponen custom di seluruh halaman.

## 2. Typography

- Font: **Plus Jakarta Sans** (semua berat: Regular 400, Medium 500, SemiBold 600, Bold 700).
- Hierarki disarankan:
  - Judul halaman (H1): 20–24px, SemiBold.
  - Judul section (H2): 16–18px, SemiBold.
  - Body/label form: 14px, Regular/Medium.
  - Caption/helper text: 12px, Regular.

## 3. Iconography

- Library: **Lucide React**, load via CDN/package — bukan emoji sama sekali.
- Icon yang dibutuhkan (contoh): `Menu` (hamburger), `ChevronDown` (dropdown), `Check` (checkbox/sukses), `X` (close/error), `Info` (information), `Lock` (admin locked), `Download` (export), `Pencil` (edit), `Trash2` (hapus), `Search`, `User`, `Shirt` (jersey, jika tersedia — fallback `Package`).

## 4. Komponen Custom

### 4.1 CustomDropdown
- Trigger button + panel opsi.
- Animasi: fade + scale (misal `opacity 0→1`, `scale(0.95)→scale(1)`, durasi 150–200ms, easing `ease-out`).
- Keyboard: `↑`/`↓` navigasi antar opsi, `Enter` pilih, `Esc` tutup.
- ARIA: `role="listbox"` pada panel, `role="option"` per item, `aria-expanded` pada trigger.

### 4.2 CustomCheckbox
- Dipakai di filter gender admin.
- Animasi check: scale/path-draw smooth (~150ms).
- State: unchecked, checked, focus-visible (outline jelas untuk aksesibilitas).

### 4.3 Custom Scrollbar
- WebKit: `::-webkit-scrollbar`, thumb rounded, warna sesuai palet (lihat §5), track transparan.
- Firefox fallback: `scrollbar-width: thin` + `scrollbar-color`.

### 4.4 Toast (Notifikasi Sukses)
- Posisi: fixed top-center (mobile) / top-right (desktop).
- Animasi: slide-in dari atas (`translateY(-20px)→0` + fade), auto-dismiss 3 detik dengan fade-out.
- Icon `Check` di dalam toast sukses.

### 4.5 Skeleton Loader
- Shimmer effect (gradient animasi horizontal) menggantikan bentuk form/kartu sebelum data siap.
- Durasi minimum tampil: 400ms (hindari flicker meski fetch cepat).

### 4.6 Splash Screen
- Logo di tengah layar.
- Animasi: `scale(0.3)→scale(1)` + `opacity 0→1`, durasi ~800ms, easing `ease-out`.
- Lanjut: fade-out splash → fade-in halaman utama.

## 5. Warna (disarankan, dapat disesuaikan brand PusakaFC26)

- Base: netral (putih/abu sangat terang untuk background, abu gelap untuk teks) agar clean minimalism tetap dominan.
- Primary accent: satu warna brand (misal biru atau warna tim) dipakai konsisten untuk tombol utama, link aktif, badge gender.
- Gender badge: 2 warna berbeda namun tetap dalam satu palet (misal biru muda untuk Pria, pink/ungu muda untuk Wanita) — gunakan juga label teks "Pria"/"Wanita", jangan andalkan warna saja (aksesibilitas).
- Status: sukses (hijau), error (merah), warning (kuning/oranye) — dipakai minimal, hanya untuk feedback form.

## 6. Layout

### 6.1 Top Bar (sticky, semua halaman)
```
[ Logo ] [ PusakaFC26 ]                    [ Hamburger menu ]
```
- Logo + nama brand rata kiri.
- Hamburger menu rata kanan, membuka Sidebar (drawer dari kanan atau kiri, mobile-first → full/partial overlay).

### 6.2 Sidebar (drawer/overlay)
Urutan dari atas ke bawah:
1. Logo + "PusakaFC26" (header sidebar).
2. Link: Halaman 1 — "Form Pendaftaran Jersey".
3. Link: Halaman 2 — "Nomor Punggung Terpakai".
4. Link: "Lihat Detail Data" — tampil dengan ikon `Lock`, style disabled (opacity rendah, cursor not-allowed, tidak clickable untuk publik).
5. Divider.
6. "Information" — posisi sticky di bawah sidebar (seperti tombol settings), expand/collapse submenu: About, Privacy Policy, Terms of Services, Admin Contact, Developer Contact.

### 6.3 Halaman 1 — Form
- Single column di mobile, max-width terpusat di desktop (misal 480–560px) agar tetap terasa mobile-first.
- Urutan field sesuai SPEC.md §3.1.
- Error inline di bawah tiap field (real-time untuk Nama/No. Belakang, on-blur/on-submit untuk field lain).
- Tombol submit full-width di mobile, sticky di bawah viewport (opsional) agar mudah dijangkau jempol.

### 6.4 Halaman 2 — Nomor Terpakai
- List/card per nomor: `#<nomor>` + badge gender + (opsional) nama belakang.
- Scrollable area menggunakan custom scrollbar.
- Search/filter tidak wajib di halaman ini (hanya untuk admin), tapi boleh ditambah sort by nomor.

### 6.5 Admin Dashboard
- 3 summary cards (grid 1 kolom mobile → 3 kolom desktop): Total Entri, Total Pria, Total Wanita.
- Tombol export (.xlsx, .json) — ikon `Download`, posisi dekat judul tabel.
- Tabel data: responsive (card-style di mobile, table di desktop), dengan search bar + filter gender (custom checkbox/dropdown) + pagination 20/halaman.
- Row actions: ikon `Pencil` (edit) dan `Trash2` (hapus) di tiap baris.

## 7. Accessibility Checklist

- Semua interactive element dapat diakses via keyboard (Tab, Enter, Esc, Arrow keys untuk dropdown).
- Focus state terlihat jelas (outline/ring) di semua tombol, input, link.
- Label form terhubung ke input via `htmlFor`/`id` atau `aria-label`.
- Kontras warna teks terhadap background memenuhi minimal WCAG AA.
- Toast dan error message menggunakan `aria-live="polite"` agar terbaca screen reader.
- Badge gender tidak hanya mengandalkan warna — selalu sertai teks label.
