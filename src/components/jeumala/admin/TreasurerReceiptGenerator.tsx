"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Download, ImagePlus, MessageCircle, Send } from "lucide-react";
import type { UsedEntry } from "@/lib/validations";
import { CustomDropdown } from "@/components/jeumala/CustomDropdown";
import { useToast } from "@/components/jeumala/Toast";

function currency(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export function TreasurerReceiptGenerator() {
  const { show } = useToast();
  const [registrants, setRegistrants] = useState<UsedEntry[]>([]);
  const [registrantId, setRegistrantId] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingRegistrants, setLoadingRegistrants] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch("/api/orders", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const body = await response.json();
        setRegistrants(body.data as UsedEntry[]);
      })
      .catch(() => show({ variant: "error", title: "Gagal memuat daftar pendaftar." }))
      .finally(() => setLoadingRegistrants(false));
  }, [show]);

  const options = [...registrants].sort((a, b) => a.fullName.localeCompare(b.fullName, "id")).map((entry) => ({ value: entry.id, label: `${entry.fullName} · No. ${entry.backNumber}` }));
  const selected = registrants.find((entry) => entry.id === registrantId);

  function handlePhoneChange(value: string) {
    const digits = value.replace(/\D/g, "");
    setPhone(digits.startsWith("62") ? digits.slice(2) : digits.startsWith("0") ? digits.slice(1) : digits);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected || !phone.trim() || !amount || busy) return;
    await generateReceipt();
  }

  async function generateReceipt() {
    if (!selected || !phone.trim() || !amount || busy) return;
    setBusy(true);
    try {
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = 900; canvas.height = 760;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas tidak tersedia.");
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#075b2a"; ctx.fillRect(0, 0, canvas.width, 14);
      ctx.fillStyle = "#111827"; ctx.font = "bold 38px sans-serif"; ctx.fillText("PusakaFC26", 70, 90);
      ctx.font = "24px sans-serif"; ctx.fillStyle = "#64748b"; ctx.fillText("Bukti Pembayaran", 70, 130);
      ctx.strokeStyle = "#dbe3df"; ctx.beginPath(); ctx.moveTo(70, 170); ctx.lineTo(830, 170); ctx.stroke();
      ctx.fillStyle = "#334155"; ctx.font = "24px sans-serif";
      ctx.fillText("Nama", 70, 235); ctx.fillText("No. HP / WA", 70, 305); ctx.fillText("Nominal", 70, 375); if (note.trim()) ctx.fillText("Catatan", 70, 445);
      ctx.fillStyle = "#111827"; ctx.font = "bold 28px sans-serif";
      ctx.fillText(selected.fullName, 350, 235); ctx.fillText(`+62${phone.replace(/\D/g, "")}`, 350, 305); ctx.fillText(currency(Number(amount)), 350, 375); if (note.trim()) ctx.fillText(note.trim().slice(0, 32), 350, 445);
      ctx.fillStyle = "#64748b"; ctx.font = "20px sans-serif"; ctx.fillText(new Date().toLocaleString("id-ID"), 70, 650);
      ctx.fillStyle = "#075b2a"; ctx.font = "bold 24px sans-serif"; ctx.fillText("Transaksi tercatat", 70, 705);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Gagal membuat gambar.")), "image/png"));
      const file = new File([blob], `struk-${Date.now()}.png`, { type: "image/png" });
      const form = new FormData();
      form.append("registrantId", selected.id); form.append("fullName", selected.fullName); form.append("phoneNumber", `62${phone.trim()}`); form.append("amount", amount); form.append("note", note); form.append("image", file);
      const response = await fetch("/api/admin/treasurer-receipts", { method: "POST", body: form });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Gagal menyimpan struk.");
      setImageFile(file); setImageUrl(URL.createObjectURL(blob));
      show({ variant: "success", title: "Struk berhasil dibuat dan disimpan." });
    } catch (error) {
      show({ variant: "error", title: error instanceof Error ? error.message : "Gagal membuat struk." });
    } finally { setBusy(false); }
  }

  function download() {
    if (!imageUrl) return;
    const link = document.createElement("a"); link.href = imageUrl; link.download = imageFile?.name || "struk-pembayaran.png"; link.click();
  }

  async function share() {
    if (!imageFile) return;
    if (navigator.share && navigator.canShare?.({ files: [imageFile] })) await navigator.share({ files: [imageFile], title: "Bukti Pembayaran PusakaFC26" });
    else window.open(`https://wa.me/?text=${encodeURIComponent(`Bukti pembayaran ${selected?.fullName || "PusakaFC26"}`)}`, "_blank");
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-6"><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-app-accent">Bendahara</p><h1 className="text-2xl font-extrabold tracking-tight text-app-fg sm:text-3xl">Struk Generator</h1><p className="mt-1.5 text-sm text-app-muted">Buat bukti pembayaran dan simpan riwayatnya untuk dibagikan kepada user.</p></header>
      <form onSubmit={submit} className="grid gap-5 rounded-2xl border border-app-border bg-app-surface p-5 shadow-sm sm:grid-cols-2 sm:p-6">
        <CustomDropdown label="Nama Lengkap" required value={registrantId} onChange={setRegistrantId} options={options} placeholder={loadingRegistrants ? "Memuat pendaftar…" : "Pilih nama pendaftar"} disabled={loadingRegistrants} searchable />
        <div><label htmlFor="generator-phone" className="mb-1.5 block text-sm font-semibold text-app-fg">No. HP / WhatsApp <span className="text-app-danger">*</span></label><div className="relative flex items-center rounded-xl border border-app-border bg-app-surface transition-colors focus-within:border-app-accent focus-within:ring-2 focus-within:ring-app-accent/20"><MessageCircle className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" /><span className="ml-10 border-r border-app-border pr-2.5 text-sm font-semibold text-app-fg-soft">+62</span><input id="generator-phone" required value={phone} onChange={(event) => handlePhoneChange(event.target.value)} placeholder="85213896460" inputMode="tel" className="w-full rounded-r-xl bg-transparent py-3 pl-2.5 pr-3.5 text-sm text-app-fg outline-none placeholder:text-app-muted" /></div><p className="mt-1.5 text-xs text-app-muted">Masukkan nomor setelah +62, contoh: 85213896460.</p></div>
        <label className="text-sm font-semibold text-app-fg">Nominal (Rp)<input required type="text" inputMode="numeric" minLength={1} value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ""))} placeholder="Contoh: 170000" className="mt-1.5 w-full rounded-xl border border-app-border bg-transparent px-3 py-3 font-normal outline-none focus:border-app-accent" /><span className="mt-1.5 block text-xs font-normal text-app-muted">Masukkan angka penuh tanpa titik atau koma, contoh: 170000.</span></label>
        <label className="text-sm font-semibold text-app-fg">Note <span className="font-normal text-app-muted">(opsional)</span><input value={note} onChange={(event) => setNote(event.target.value)} className="mt-1.5 w-full rounded-xl border border-app-border bg-transparent px-3 py-3 font-normal outline-none focus:border-app-accent" /></label>
        <button type="submit" disabled={busy || !registrantId} className="jc-focus inline-flex items-center justify-center gap-2 rounded-xl bg-app-accent px-4 py-3 font-bold text-app-accent-fg disabled:opacity-60 sm:col-span-2">{busy ? <span className="jc-spinner" /> : <Send className="h-4 w-4" />}Generate &amp; Simpan</button>
      </form>
      <canvas ref={canvasRef} className="hidden" />
      {imageUrl && <section className="mt-6 rounded-2xl border border-app-border bg-app-surface p-5 shadow-sm"><div className="rounded-xl bg-app-surface-2 p-3"><img src={imageUrl} alt="Preview struk pembayaran" className="mx-auto max-h-[560px] w-full object-contain" /></div><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={download} className="jc-focus inline-flex items-center gap-2 rounded-xl bg-app-accent px-4 py-3 text-sm font-bold text-app-accent-fg"><Download className="h-4 w-4" />Download</button><button type="button" onClick={() => void share()} className="jc-focus inline-flex items-center gap-2 rounded-xl border border-app-accent/30 px-4 py-3 text-sm font-bold text-app-accent-strong"><MessageCircle className="h-4 w-4" />WhatsApp</button></div></section>}
      <div className="mt-4 flex items-center gap-2 text-xs text-app-muted"><ImagePlus className="h-4 w-4" />Struk dibuat sebagai gambar dan disimpan sebagai riwayat.</div>
    </div>
  );
}
