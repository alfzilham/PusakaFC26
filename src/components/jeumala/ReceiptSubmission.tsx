"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, FileImage, MessageCircle, Send, UploadCloud } from "lucide-react";
import type { UsedEntry } from "@/lib/validations";
import { CustomDropdown } from "./CustomDropdown";
import { useToast } from "./Toast";
import { cn } from "@/lib/utils";

export function ReceiptSubmission({ used }: { used: UsedEntry[] }) {
  const { show } = useToast();
  const [registrantId, setRegistrantId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const options = [...used]
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "id"))
    .map((entry) => ({ value: entry.id, label: `${entry.fullName} · No. ${entry.backNumber}` }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!registrantId || !phoneNumber.trim() || !file || submitting) return;
    setSubmitting(true);
    setError(null);
    setDone(false);
    const form = new FormData();
    form.append("registrantId", registrantId);
    form.append("phoneNumber", phoneNumber.trim());
    form.append("receiptImage", file);
    try {
      const response = await fetch("/api/receipts/submit", { method: "POST", body: form });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Bukti transfer gagal diproses.");
      setDone(true);
      setFile(null);
      setPhoneNumber("");
      show({ variant: "success", title: "Bukti transfer terkirim", description: "Bendahara akan memverifikasi data Anda." });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Koneksi gagal.";
      setError(message);
      show({ variant: "error", title: "Pengiriman gagal", description: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <header className="mb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-app-accent">Struk Scanner</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-app-fg sm:text-3xl">Submit Bukti Transfer</h1>
        <p className="mt-1.5 text-sm text-app-muted">Unggah bukti pembayaran untuk diverifikasi Bendahara.</p>
      </header>
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-app-border bg-app-surface p-5 shadow-sm sm:p-6">
        <CustomDropdown
          label="Nama Lengkap"
          required
          value={registrantId}
          onChange={setRegistrantId}
          options={options}
          placeholder="Pilih nama pendaftar"
        />
        <div>
          <label htmlFor="receipt-phone" className="mb-1.5 block text-sm font-semibold text-app-fg">No. HP / WhatsApp <span className="text-app-danger">*</span></label>
          <div className="relative">
            <MessageCircle className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" />
            <input id="receipt-phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Contoh: 081234567890" inputMode="tel" className="jc-focus w-full rounded-xl border border-app-border bg-app-surface py-3 pl-10 pr-3.5 text-sm text-app-fg placeholder:text-app-muted" />
          </div>
          <p className="mt-1.5 text-xs text-app-muted">Nomor akan divalidasi ke WhatsApp saat dikirim.</p>
        </div>
        <div>
          <label htmlFor="receipt-image" className="mb-1.5 block text-sm font-semibold text-app-fg">Foto Struk <span className="text-app-danger">*</span></label>
          <label htmlFor="receipt-image" className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-app-border-strong bg-app-surface-2 px-5 py-8 text-center transition-colors hover:border-app-accent hover:bg-app-accent/5">
            {file ? <FileImage className="mb-2 h-8 w-8 text-app-accent" /> : <UploadCloud className="mb-2 h-8 w-8 text-app-muted" />}
            <span className="text-sm font-semibold text-app-fg">{file ? file.name : "Pilih gambar struk"}</span>
            <span className="mt-1 text-xs text-app-muted">JPG, PNG, atau WEBP · maksimal 10 MB</span>
            <input id="receipt-image" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
        </div>
        {error && <p role="alert" className="rounded-xl border border-app-danger/30 bg-app-danger-soft p-3 text-sm font-medium text-app-danger">{error}</p>}
        {done && <p className="flex items-center gap-2 rounded-xl border border-app-accent/30 bg-app-accent/5 p-3 text-sm font-medium text-app-accent-strong"><CheckCircle2 className="h-4 w-4" /> Bukti transfer sedang menunggu verifikasi.</p>}
        <button type="submit" disabled={!registrantId || !phoneNumber.trim() || !file || submitting} className={cn("jc-focus flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition-all", (!registrantId || !phoneNumber.trim() || !file || submitting) ? "cursor-not-allowed bg-app-border text-app-muted" : "bg-app-accent text-app-accent-fg shadow-sm hover:bg-app-accent-strong active:scale-[0.99]")}>
          {submitting ? <span className="jc-spinner" /> : <Send className="h-4 w-4" />}
          {submitting ? "Memindai struk…" : "Kirim Bukti Transfer"}
        </button>
      </form>
    </div>
  );
}
