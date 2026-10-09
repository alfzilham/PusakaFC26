Jadi, saya ada project untuk membuat sistem untuk Input nama yang ingin membuat baju bola. project ini dibuat tanpa loginpage. jadi, alur kerjanya, ketika ada orang yang membuka halaman ini, akan muncul logo dengan overlay animation dari kecil ke besar. dan dilanjutkan ke halaman UI nya. ketika sudah tiba di halaman UI, akan ada skeleton loader. setelah skeleton loader selesai, akan muncul form untuk input sebagai berikut:
Halaman Pertama:

1. Gender (Style: Dropdown - Pria/Wanita)
2. Nama Lengkap (Required)
3. Nama Belakang baju (Diblokir system jika ada nama yang sudah di gunakan - Required)
4. No. Belakang baju (Diblokir Sistem jika ada No. yang sama - Required)
5. Ukuran (XXXL, XXL, XL, L, M, S - Required) - (Style: Dropdown)
6. Panjang/Pendek Lengan (Required - Style: Dropdown)

Halaman kedua:
Halaman kedua menampilkan jumlah no. yang sudah digunakan.
Kedua halaman tersebut dapat di akses juga melalui sidebar. untuk sidebar, ada:

* Nama Brand (PusakaFC26) dengan logo - Terletak bagian atas
* halaman pertama (Tolong rekomendasikan title untuk halaman pertama)
* halaman kedua (Tolong rekomendasikan title untuk halaman kedua)
* Lihat Detail Data (Diblokir dan tidak dapat di klik, hanya dapat diakses oleh admin. oleh karena itu, buat halaman admin)
* Information, letaknya sticky dibagian seperti setting. tapi untuk setting ini diganti dengan information. di information itu ada:
  * About (Informasi tentang software ini)
  * Privacy Policy
  * Terms of Services
  * Developer Contact: `Nama: Alfiz Ilham`, `No. Wa: 0852-1389-6460` 

selain halaman, ada Top bar. betuknya:

```
 [ Logo ] [ PusakaFC26 ]                    [ Humburger menu ]
```

selain itu, gunakan Style clean minimalism yang mudah digunakan saja. Fokus pada Mobile-first dan berikut kriteria yang akan saya gunakan:

1. React/Next.js Router Full-stack
2. Prisma sebagai DB
3. Railway untuk deploy

untuk fitur "Lihat Detail Data", Data nya akan di Export ke file dengan format `.xlxs`. karena sebelumnya ada pemilihan gender, maka didalam file `.xlxs` tersebut ada 2 sheet. sheet pertama untuk "Pria" dan sheet kedua untuk "Wanita". dari fitur ini, akan ada yang nama nya admin page. di admin page ini akan ada banyak fitur lainnya, seperti jumlah nama yang sudah input datanya, undul file laporan dengan format `.xlxs` dan `.json`. 
untuk kriteria wajib yang ada di bagian UI nya:

1. Menggunakan font 'Plus Jakarta Sans'
2. Menggunakan icon Library CDN dari Lucide React Icon dan jangan gunakan icon emoji
3. menggunakan costum Webkit Scroll bar, Costum Dropdown, dan Costum checkbox, dll dengan animasi yang smooth
4. Accessibility

Tugas kamu adalah membuat file-file berikut:

1. `SPEC.md` 
2. `ARCHITECTURE.md` 
3. `DESIGN.md` 
4. `CONTEXT,md` 
5. Prompt siap copas untuk [https://chat.z.ai](https://chat.z.ai)

Pertanyaan yang mungkin timbul jika kurang jelas:
Q: Validasi nama/nomor yang sudah dipakai, kapan dicek?
A: Kombinasi: real-time untuk cek cepat + validasi ulang saat submit

Q: Keunikan Nama Belakang & No. Belakang baju: global atau per-gender?
A: Keunikan Nama Belakang & No. Belakang baju: global atau per-gender?

Q: Rentang No. Belakang baju yang valid?
A: 1-999 (bebas sampai 3 digit)

Q: Perlu batas panjang karakter untuk Nama Belakang baju?
A: maks 15-20 karakter

Q: Bentuk tampilan halaman kedua?
A: Daftar No. yang sudah dipakai saja

Q: Proteksi untuk Admin Page?
A: Perlu proteksi akses (password/PIN sederhana) meski tidak ada login page untuk user umum dan diakses melalui path lainnya seperti `https://DOMAIN-RAILWAY-BARU/admin/` 

Q: Fitur admin ada apa saja?
A: tambah fitur edit dan hapus entri

Q: Database Prisma yang dipakai di Railway?
A: PostgreeSQL

yang akan eksekusi project ini adalah [https://chat.z.ai](https://chat.z.ai)

dan berikut hasil brainstorming dengan claude agar semuanya tercapai

````
Klasifikasi: ini Architectural — proyek baru, full-stack, multi-subsystem (form input, validasi real-time, admin panel, export, auth sederhana). Jadi saya akan ikuti proses penuh: eksplorasi, pertanyaan klarifikasi satu-satu, usulan pendekatan, desain bertahap, lalu spec doc — baru setelah itu writing-plans (bukan langsung coding).



Anda sudah memberi banyak detail bagus (termasuk Q&A sendiri). Saya cek dulu apakah ada project context yang relevan di memory, lalu lanjut dengan pertanyaan klarifikasi yang masih perlu dijawab.



Baik, sudah jelas gambaran latar belakang Anda. Mari mulai dengan pertanyaan klarifikasi yang belum terjawab — satu per satu.



Pertanyaan 1 — Proteksi admin page:



Anda bilang "perlu proteksi password/PIN sederhana" tanpa login page untuk user umum. Untuk admin, bagaimana bentuk proteksinya?



Bentuk proteksi admin seperti apa yang Anda inginkan?

Password + rate limiting (anti brute-force untuk keamanan lebih)



Dicatat: Password + rate limiting.



Pertanyaan 2 — Real-time validasi nama/nomor:



Untuk cek real-time (saat user mengetik nama belakang baju / nomor), bagaimana mekanismenya?



Mekanisme cek real-time untuk nama belakang & nomor baju?

Rekomendasikan



Untuk kasus ini saya rekomendasikan opsi 2: fetch semua data terpakai sekali di awal (saat halaman load), lalu cek duplikasi di client-side — dengan alasan:



Skala data kecil (maks 999 nomor per gender, nama belakang kemungkinan besar di bawah ribuan entri) — ringan untuk di-fetch sekaligus.

Tidak ada latency ketik → cek (feedback instan, UX lebih smooth untuk mobile-first).

Mengurangi beban server/DB (tidak ada request berulang tiap keystroke).

Tetap divalidasi ulang di server saat submit (sesuai keputusan Anda sebelumnya: real-time + submit) untuk menghindari race condition kalau 2 orang submit bersamaan.

Re-fetch data terpakai otomatis setelah submit sukses, supaya daftar tetap fresh untuk user berikutnya.



Lanjut ke pertanyaan berikutnya.



Pertanyaan 3 — Rate limiting admin login:



Aturan rate limiting untuk login admin yang gagal?

5x gagal → lock 15 menit



Dicatat: 5x gagal → lock 15 menit.



Pertanyaan 4 — Desain database untuk halaman kedua ("daftar no. yang sudah dipakai"):



Apakah halaman kedua perlu dipisah per gender (misal tab Pria/Wanita), atau digabung dalam satu daftar dengan label gender di sampingnya?



Tampilan halaman kedua (daftar nomor terpakai)?

Satu daftar gabungan dengan badge/label gender di tiap item



Dicatat: Satu daftar gabungan + badge gender.



Pertanyaan 5 — Keunikan global vs per-gender (ini perlu klarifikasi ulang, jawaban sebelumnya tidak terbaca jelas):



Anda menulis pertanyaan ini dua kali tanpa jawaban final yang jelas — tolong konfirmasi: apakah Nama Belakang baju & No. Belakang baju harus unik secara global (lintas gender, jadi "Alfiz" & No. 10 hanya bisa dipakai 1x total), atau per-gender (Pria dan Wanita masing-masing punya pool nomor/nama terpisah, jadi No. 10 bisa dipakai 1x di Pria DAN 1x di Wanita)?



Keunikan Nama Belakang & No. Belakang: global atau per-gender?

Global (unik lintas semua gender)



Dicatat: Global. Ini konsisten dengan desain .xlsx 2-sheet Anda — sheet hanya untuk tampilan laporan, bukan pool keunikan terpisah.



Pertanyaan 6 — Panjang/Pendek Lengan: hanya 2 opsi, atau ada varian lain?



Opsi untuk field Panjang/Pendek Lengan?

Hanya 2: Panjang / Pendek



Dicatat. Lanjut.



Pertanyaan 7 — Setelah submit form berhasil, apa yang terjadi?



Setelah submit form berhasil, apa yang ditampilkan ke user?

Tampilkan modal/toast sukses, form langsung reset di tempat (tetap di halaman pertama)



Dicatat. Lanjut.



Pertanyaan 8 — Apakah user bisa mengedit/membatalkan inputnya sendiri setelah submit? (Misal salah ketik nama, mau koreksi)



Apakah user bisa edit/batalkan input sendiri setelah submit?

Tidak bisa — user harus hubungi admin (WA developer) untuk koreksi



Dicatat. Ini menyederhanakan banyak hal — tidak perlu sistem token/edit untuk user publik.



Pertanyaan 9 — Admin page fitur edit/hapus: perlu konfirmasi (misal modal "yakin hapus?") sebelum eksekusi, atau langsung?



Konfirmasi sebelum admin edit/hapus data?

Konfirmasi modal untuk hapus saja (edit langsung simpan)



Dicatat. Lanjut.



Pertanyaan 10 — Admin page: perlu search/filter untuk tabel data (nama, nomor, gender), atau cukup tabel biasa dengan pagination saja?



Fitur tabel data di admin page?

Search bar + filter gender + pagination



Baik, lanjut ke desain detail sebelum menulis file. Saya akan sajikan per bagian — beri tahu saja kalau ada yang ingin diubah, kalau tidak saya lanjut langsung tulis semua file setelah ini.



Desain Detail



Skema Prisma (inti):



```

enum Gender { PRIA WANITA }

enum SleeveType { PANJANG PENDEK }

enum Size { S M L XL XXL XXXL }



model JerseyOrder {

  id         String   @id @default(cuid())

  gender     Gender

  fullName   String

  backName   String   @unique

  backNumber Int      @unique

  size       Size

  sleeve     SleeveType

  createdAt  DateTime @default(now())

  updatedAt  DateTime @updatedAt

}



model AdminLoginAttempt {

  id        String   @id @default(cuid())

  ip        String

  success   Boolean

  createdAt DateTime @default(now())

}

```



Komponen UI custom (sesuai kriteria wajib):



CustomDropdown — animasi fade+scale, keyboard nav (↑↓ Enter Esc), ARIA role="listbox"

CustomCheckbox — dipakai di filter gender admin, animasi check smooth

Scrollbar custom via CSS (::-webkit-scrollbar + scrollbar-width fallback Firefox)

Semua pakai Lucide React (ChevronDown, Check, X, dll — bukan emoji)



Animasi:



Logo splash: scale 0.3→1 + fade in, ~800ms, lalu fade out ke UI

Skeleton loader: shimmer effect, durasi fetch cache (biasanya <500ms, minimum tampil 400ms agar tidak flicker)

Toast sukses: slide-in dari atas, auto-dismiss 3s



Rekomendasi Title Halaman:



Halaman 1: "Form Pendaftaran Jersey"

Halaman 2: "Nomor Punggung Terpakai"



Validasi field:



Field	Aturan

Nama Lengkap	required, min 3 karakter

Nama Belakang	required, 2–20 karakter, unik global, alfanumerik+spasi

No. Belakang	required, 1–999, integer, unik global

Ukuran	required, enum

Lengan	required, enum



Admin dashboard:



Card ringkasan: total entri, total Pria, total Wanita

Tombol export .xlsx dan .json

Tabel: search (nama/nama belakang/no), filter gender (custom checkbox/dropdown), pagination (20/halaman)

Row actions: Edit (inline/modal, langsung simpan) · Hapus (modal konfirmasi)



Setuju? Kalau ya, saya langsung tulis kelima file.



tambahkan lagi di validasi field, yaitu button submit. semuanya sudah lengkap dan lanjut buatkan file nya tanpa konfirmasi lagi



Baik, saya tambahkan validasi tombol submit: disabled selama ada field kosong/invalid, atau sedang proses submit (loading state dengan spinner), untuk mencegah double-submit. Sekarang saya tulis kelima file.
````
