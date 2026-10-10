"use client";

import { Info, Shield, FileText, Phone } from "lucide-react";
import { Modal } from "./Modal";
import { ADMIN_CONTACT, APP_NAME, SUPER_ADMIN } from "@/lib/constants";
import type { InfoKey } from "./Sidebar";

const WA_DISPLAY = SUPER_ADMIN.whatsapp;
const WA_HREF = SUPER_ADMIN.whatsappHref;
const ADMIN_WA_DISPLAY = ADMIN_CONTACT.whatsapp;
const ADMIN_WA_HREF = ADMIN_CONTACT.whatsappHref;

export function InformationPanel({
  info,
  onClose,
}: {
  info: InfoKey | null;
  onClose: () => void;
}) {
  const map: Record<InfoKey, { title: string; icon: React.ReactNode }> = {
    about: { title: "About", icon: <Info className="h-5 w-5 text-app-accent" /> },
    privacy: { title: "Privacy Policy", icon: <Shield className="h-5 w-5 text-app-accent" /> },
    terms: { title: "Terms of Services", icon: <FileText className="h-5 w-5 text-app-accent" /> },
    "admin-contact": { title: "Admin Contact", icon: <Phone className="h-5 w-5 text-app-accent" /> },
    contact: { title: "Super Admin Contact", icon: <Phone className="h-5 w-5 text-app-accent" /> },
  };

  if (!info) return null;

  return (
    <Modal open={!!info} onClose={onClose} title={map[info].title} icon={map[info].icon}>
      {info === "about" && <AboutContent />}
      {info === "privacy" && <PrivacyContent />}
      {info === "terms" && <TermsContent />}
      {info === "admin-contact" && <AdminContactContent />}
      {info === "contact" && <ContactContent />}
    </Modal>
  );
}

function AboutContent() {
  return (
    <div className="space-y-4">
      <p>
        <strong>{APP_NAME}</strong> adalah sistem pendaftaran nama dan nomor
        punggung jersey untuk event {APP_NAME}. Aplikasi ini memungkinkan
        peserta mendaftarkan data jersey mereka secara cepat dan akurat.
      </p>
      <div className="rounded-xl border border-app-border bg-app-surface-2 p-4">
        <h3 className="mb-2 font-semibold text-app-fg">Fitur Utama</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-app-fg-soft">
          <li>Pendaftaran jersey dengan validasi real-time.</li>
          <li>Pencegahan duplikat nama & nomor punggung untuk user dan admin.</li>
          <li>Daftar nomor punggung terpakai yang dapat dilihat publik.</li>
          <li>Panel admin terproteksi untuk mengelola data.</li>
        </ul>
      </div>
      <p className="text-xs text-app-muted">
        Versi 1.0 · Dibangun dengan Next.js, Prisma, dan Lucide Icons.
      </p>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-app-border bg-app-surface-2 p-4">
        <h3 className="mb-2 font-semibold text-app-fg">Data yang Dikumpulkan</h3>
        <p className="text-app-fg-soft">
          Kami mengumpulkan data berikut saat Anda mendaftar: gender, nama
          lengkap, nama belakang jersey, nomor punggung, ukuran, dan panjang
          lengan jersey.
        </p>
      </div>
      <div className="rounded-xl border border-app-border bg-app-surface-2 p-4">
        <h3 className="mb-2 font-semibold text-app-fg">Penggunaan Data</h3>
        <p className="text-app-fg-soft">
          Data digunakan semata-mata untuk produksi jersey dan keperluan
          administrasi event {APP_NAME}. Data tidak dibagikan ke pihak ketiga
          di luar keperluan tersebut.
        </p>
      </div>
      <div className="rounded-xl border border-app-border bg-app-surface-2 p-4">
        <h3 className="mb-2 font-semibold text-app-fg">Penyimpanan & Keamanan</h3>
        <p className="text-app-fg-soft">
          Data disimpan pada basis data terproteksi. Akses pengelolaan hanya
          melalui panel admin yang dilindungi password dengan pembatasan
          percobaan login. Aksi perubahan dan export hanya tersedia untuk
          super admin setelah verifikasi tambahan.
        </p>
      </div>
      <p className="text-xs text-app-muted">
        Jika ada pertanyaan terkait privasi, hubungi admin atau super admin
        melalui menu kontak yang tersedia.
      </p>
    </div>
  );
}

function TermsContent() {
  return (
    <div className="space-y-4">
      <ol className="list-decimal space-y-3 pl-5">
        <li>
          <strong>Ketepatan Data:</strong> Peserta bertanggung jawab atas
          kebenaran data yang dimasukkan. Setelah submit, data tidak dapat
          diedit atau dibatalkan oleh peserta.
        </li>
        <li>
          <strong>Keunikan:</strong> Nama belakang dan nomor punggung user dan
          admin bersifat unik secara global. Jika sudah dipakai, peserta harus
          memilih yang lain.
        </li>
        <li>
          <strong>Koreksi Data:</strong> Untuk koreksi data setelah submit,
          peserta wajib menghubungi admin atau super admin via WhatsApp.
        </li>
        <li>
          <strong>Penggunaan Wajar:</strong> Pesenta dilarang melakukan upaya
          perusakan, spam, atau akses tidak sah ke sistem.
        </li>
        <li>
          <strong>Perubahan Ketentuan:</strong> Penyelenggara berhak memperbarui
          ketentuan ini sewaktu-waktu.
        </li>
      </ol>
      <p className="text-xs text-app-muted">
        Dengan mendaftar, peserta dianggap menyetujui ketentuan di atas.
      </p>
    </div>
  );
}

function AdminContactContent() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-app-border bg-app-surface-2 p-4">
        <p className="font-semibold text-app-fg">{ADMIN_CONTACT.name}</p>
        <p className="mt-1 text-sm text-app-muted">Admin · {APP_NAME}</p>
      </div>
      <a
        href={ADMIN_WA_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="jc-focus flex items-center justify-between gap-3 rounded-xl border border-app-border bg-app-surface-2 p-4 transition-colors hover:border-app-accent/40 hover:bg-app-accent/5"
      >
        <div className="flex items-center gap-3">
          <Phone className="h-5 w-5 text-app-accent" />
          <div>
            <p className="text-xs text-app-muted">WhatsApp Admin</p>
            <p className="font-semibold text-app-fg">{ADMIN_WA_DISPLAY}</p>
          </div>
        </div>
        <span className="rounded-lg bg-app-accent px-3 py-1.5 text-xs font-semibold text-app-accent-fg">
          Chat
        </span>
      </a>
      <p>
        Hubungi admin untuk pertanyaan pendaftaran, konfirmasi data, atau
        koreksi informasi jersey. Aksi perubahan data dilakukan oleh admin
        dengan otorisasi super admin.
      </p>
      <p className="text-xs text-app-muted">
        Untuk bantuan teknis dan akses super admin, buka menu Super Admin Contact.
      </p>
    </div>
  );
}

function ContactContent() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-xl border border-app-border bg-app-surface-2 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-accent/10 text-base font-bold text-app-accent-strong">
          AI
        </div>
        <div>
          <p className="font-semibold text-app-fg">{SUPER_ADMIN.name}</p>
          <p className="text-sm text-app-muted">Super Admin · {APP_NAME}</p>
        </div>
      </div>
      <a
        href={WA_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="jc-focus flex items-center justify-between gap-3 rounded-xl border border-app-border bg-app-surface-2 p-4 transition-colors hover:border-app-accent/40 hover:bg-app-accent/5"
      >
        <div className="flex items-center gap-3">
          <Phone className="h-5 w-5 text-app-accent" />
          <div>
            <p className="text-xs text-app-muted">WhatsApp</p>
            <p className="font-semibold text-app-fg">{WA_DISPLAY}</p>
          </div>
        </div>
        <span className="rounded-lg bg-app-accent px-3 py-1.5 text-xs font-semibold text-app-accent-fg">
          Chat
        </span>
      </a>
      <p className="text-xs text-app-muted">
        Hubungi super admin via WhatsApp untuk koreksi data atau pertanyaan
        teknis terkait pendaftaran.
      </p>
    </div>
  );
}
