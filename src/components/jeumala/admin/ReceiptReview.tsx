"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, Eye, Inbox, MessageCircle, RefreshCw, X } from "lucide-react";
import { Modal } from "@/components/jeumala/Modal";
import { useToast } from "@/components/jeumala/Toast";
import { cn } from "@/lib/utils";
import { normalizePhone } from "@/lib/validations";

type PendingReceipt = {
  id: string;
  phoneNumber: string;
  imageUrl: string;
  createdAt: string;
  registrant: { id: string; fullName: string; backNumber: number };
};

export function ReceiptReview({ onBack }: { onBack: () => void }) {
  const { show } = useToast();
  const [rows, setRows] = useState<PendingReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PendingReceipt | null>(null);
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectedPhone, setRejectedPhone] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/receipts/pending", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const body = await response.json();
      setRows(body.data || []);
    } catch {
      show({ variant: "error", title: "Gagal memuat antrean struk." });
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => { void load(); }, [load]);

  async function review(id: string, action: "approve" | "reject") {
    setProcessing(id);
    try {
      const response = await fetch(`/api/receipts/${id}/${action}`, { method: "POST" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Aksi gagal.");
      setRows((current) => current.filter((row) => row.id !== id));
      setSelected(null);
      if (action === "reject" && body.phoneNumber) setRejectedPhone(body.phoneNumber);
      show({ variant: "success", title: action === "approve" ? "Struk disetujui." : "Struk ditolak." });
    } catch (error) {
      show({ variant: "error", title: error instanceof Error ? error.message : "Aksi gagal." });
    } finally {
      setProcessing(null);
    }
  }

  async function replaceReceipt() {
    if (!selected || !replacementFile) return;
    setProcessing(selected.id);
    try {
      const form = new FormData();
      form.append("phoneNumber", selected.phoneNumber);
      form.append("receiptImage", replacementFile);
      const response = await fetch(`/api/receipts/${selected.id}/replace`, { method: "POST", body: form });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Penggantian struk gagal.");
      setSelected(null);
      setReplacementFile(null);
      await load();
      show({ variant: "success", title: "Struk berhasil diganti", description: "Status kembali menjadi Pending Verification." });
    } catch (error) {
      show({ variant: "error", title: error instanceof Error ? error.message : "Penggantian struk gagal." });
    } finally {
      setProcessing(null);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onBack} className="jc-focus inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-surface px-3 py-2 text-sm font-semibold text-app-fg hover:bg-app-bg"><ArrowLeft className="h-4 w-4" /> Data Pendaftar</button>
        <h1 className="mr-auto text-xl font-extrabold text-app-fg">Review Bukti Transfer</h1>
        <button type="button" onClick={() => void load()} disabled={loading} className="jc-focus inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-surface px-3 py-2 text-sm font-semibold text-app-fg hover:bg-app-bg"><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh</button>
      </div>
      <p className="mb-5 rounded-xl border border-app-accent/20 bg-app-accent/5 p-4 text-sm text-app-fg-soft">Antrean ini hanya dapat diakses oleh Bendahara dan Super Admin. Approval tidak mengirim notifikasi. Setelah penolakan, Anda dapat membuka WhatsApp dengan pesan yang sudah disiapkan.</p>
      {loading ? <div className="flex justify-center py-20"><span className="jc-spinner text-app-accent" /></div> : rows.length === 0 ? <div className="rounded-2xl border border-app-border bg-app-surface px-5 py-16 text-center"><Inbox className="mx-auto h-9 w-9 text-app-muted" /><p className="mt-3 font-semibold text-app-fg">Antrean kosong</p><p className="mt-1 text-sm text-app-muted">Belum ada bukti transfer yang menunggu verifikasi.</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map((row) => <article key={row.id} className="overflow-hidden rounded-2xl border border-amber-200 bg-app-surface shadow-sm"><button type="button" onClick={() => setSelected(row)} className="block w-full text-left"><div className="aspect-[4/3] bg-app-surface-2"><img src={row.imageUrl} alt={`Bukti transfer ${row.registrant.fullName}`} className="h-full w-full object-contain" /></div><div className="space-y-1 p-4"><h2 className="font-bold text-app-fg">{row.registrant.fullName}</h2><p className="text-sm text-app-muted">WA: +{normalizePhone(row.phoneNumber)} · No. {row.registrant.backNumber}</p><span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-app-accent"><Eye className="h-3.5 w-3.5" /> Lihat detail</span></div></button><div className="flex gap-2 border-t border-app-border p-3"><button type="button" onClick={() => void review(row.id, "reject")} disabled={processing === row.id} className="jc-focus inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-app-danger/30 px-3 py-2 text-sm font-bold text-app-danger hover:bg-app-danger-soft"><X className="h-4 w-4" /> Reject</button><button type="button" onClick={() => void review(row.id, "approve")} disabled={processing === row.id} className="jc-focus inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-app-accent px-3 py-2 text-sm font-bold text-app-accent-fg hover:bg-app-accent-strong"><Check className="h-4 w-4" /> Approve</button></div></article>)}</div>}
      {selected && <Modal open onClose={() => { setSelected(null); setReplacementFile(null); }} title={`Bukti Transfer · ${selected.registrant.fullName}`} icon={<Eye className="h-5 w-5 text-app-accent" />} footer={<div className="w-full space-y-3"><label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-app-border-strong px-3 py-2 text-xs font-semibold text-app-fg-soft hover:border-app-accent"><RefreshCw className="h-4 w-4 text-app-accent" />{replacementFile ? replacementFile.name : "Pilih struk pengganti"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => setReplacementFile(event.target.files?.[0] || null)} /></label><button type="button" onClick={() => void replaceReceipt()} disabled={!replacementFile || !!processing} className="jc-focus w-full rounded-xl border border-app-accent/30 px-4 py-2.5 text-sm font-bold text-app-accent-strong disabled:opacity-50">Ganti Struk dan Scan Ulang</button><div className="flex w-full gap-2"><button type="button" onClick={() => void review(selected.id, "reject")} disabled={!!processing} className="jc-focus flex-1 rounded-xl border border-app-danger/30 px-4 py-2.5 text-sm font-bold text-app-danger">Reject</button><button type="button" onClick={() => void review(selected.id, "approve")} disabled={!!processing} className="jc-focus flex-1 rounded-xl bg-app-accent px-4 py-2.5 text-sm font-bold text-app-accent-fg">Approve</button></div></div>}><img src={selected.imageUrl} alt="Preview bukti transfer" className="max-h-[60vh] w-full rounded-xl object-contain" /><p className="mt-4 text-sm text-app-muted">Nomor WhatsApp: +{normalizePhone(selected.phoneNumber)}</p></Modal>}
      {rejectedPhone && <Modal open onClose={() => setRejectedPhone(null)} title="Kirim notifikasi WhatsApp" icon={<MessageCircle className="h-5 w-5 text-app-accent" />} footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setRejectedPhone(null)} className="jc-focus rounded-xl border border-app-border px-4 py-2.5 text-sm font-semibold text-app-fg">Tutup</button><a href={`https://wa.me/${normalizePhone(rejectedPhone)}?text=${encodeURIComponent("Halo, bukti transfer Anda untuk pendaftaran jersey belum dapat diverifikasi. Mohon upload ulang struk yang jelas melalui halaman Submit Bukti Transfer.")}`} target="_blank" rel="noopener noreferrer" onClick={() => setRejectedPhone(null)} className="jc-focus inline-flex items-center gap-2 rounded-xl bg-app-accent px-4 py-2.5 text-sm font-bold text-app-accent-fg">Buka WhatsApp</a></div>}><p>Penolakan bukti transfer sudah berhasil dicatat.</p><p className="mt-2">Klik tombol berikut untuk membuka WhatsApp dengan pesan penolakan yang sudah disiapkan. Pesan tetap harus dikirim secara manual.</p></Modal>}
    </main>
  );
}
