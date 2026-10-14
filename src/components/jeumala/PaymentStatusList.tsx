"use client";

import type { UsedEntry } from "@/lib/validations";
import { GENDER_LABEL } from "@/lib/validations";
import { cn } from "@/lib/utils";

function statusLabel(status: UsedEntry["paymentStatus"]) {
  if (status === "VERIFIED") return "Sudah Bayar";
  if (status === "PENDING_VERIFICATION") return "Pending Verifikasi";
  if (status === "REJECTED") return "Verifikasi Ditolak";
  return "Belum Bayar / Input Struk";
}

function rowTone(status: UsedEntry["paymentStatus"]) {
  if (status === "VERIFIED") return "bg-emerald-50";
  if (status === "PENDING_VERIFICATION") return "bg-amber-50";
  if (status === "REJECTED") return "bg-rose-50";
  return "bg-white";
}

export function PaymentStatusList({ used }: { used: UsedEntry[] }) {
  const rows = [...used].sort((a, b) => a.backNumber - b.backNumber);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-app-accent">Informasi Pembayaran</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-app-fg sm:text-3xl">Status Pembayaran</h1>
        <p className="mt-1.5 text-sm text-app-muted">Daftar ini hanya dapat dilihat. Status diperbarui setelah verifikasi Bendahara.</p>
      </header>
      <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm">
        <div className="jc-scroll overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-app-border bg-app-surface-2 text-xs uppercase tracking-wide text-app-muted">
                <th className="px-4 py-3 font-semibold">No. Urut</th>
                <th className="px-4 py-3 font-semibold">Gender</th>
                <th className="px-4 py-3 font-semibold">Nama Lengkap</th>
                <th className="px-4 py-3 font-semibold">Nama Belakang</th>
                <th className="px-4 py-3 font-semibold">No. Punggung</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id} className={cn("border-b border-app-border/70 last:border-0", rowTone(row.paymentStatus))}>
                  <td className="px-4 py-3 font-bold tabular-nums text-app-fg">{index + 1}</td>
                  <td className="px-4 py-3 font-semibold text-app-fg">{GENDER_LABEL[row.gender]}</td>
                  <td className="px-4 py-3 font-medium text-app-fg">{row.fullName}</td>
                  <td className="px-4 py-3 font-medium text-app-fg-soft">{row.backName}</td>
                  <td className="px-4 py-3 font-bold tabular-nums text-app-fg">{row.backNumber}</td>
                  <td className="px-4 py-3 font-semibold text-app-fg">{statusLabel(row.paymentStatus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-app-muted">
        <span className="rounded-md bg-emerald-50 px-2 py-1">Hijau · Sudah Bayar</span>
        <span className="rounded-md bg-amber-50 px-2 py-1">Kuning · Pending</span>
        <span className="rounded-md bg-rose-50 px-2 py-1">Merah · Ditolak</span>
        <span className="rounded-md border border-app-border bg-white px-2 py-1">Putih · Belum Input</span>
      </div>
    </div>
  );
}
