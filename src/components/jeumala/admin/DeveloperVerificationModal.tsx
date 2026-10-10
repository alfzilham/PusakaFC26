"use client";

import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/jeumala/Modal";

type Props = {
  open: boolean;
  actionLabel: string;
  onClose: () => void;
  onVerified: () => void;
  endpoint?: string;
  title?: string;
  closeOnError?: boolean;
  onVerificationFailed?: () => void;
};

export function DeveloperVerificationModal({
  open,
  actionLabel,
  onClose,
  onVerified,
  endpoint = "/api/admin/developer/verify",
  title = "Verifikasi Developer",
  closeOnError = false,
  onVerificationFailed,
}: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function close() {
    setPassword("");
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Verifikasi developer gagal.");
        onVerificationFailed?.();
        if (closeOnError) close();
        return;
      }
      setPassword("");
      onVerified();
    } catch {
      setError("Koneksi gagal. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      icon={<ShieldCheck className="h-5 w-5 text-app-accent" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-app-accent/20 bg-app-accent/5 p-3.5 text-sm text-app-fg-soft">
          Tunjukkan bahwa diri anda developer untuk mengakses fitur admin terbatas: <strong>{actionLabel}</strong>.
        </div>
        <div>
          <label htmlFor="developer-password" className="mb-1.5 block text-sm font-semibold text-app-fg">
            Password khusus developer
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" />
            <input
              id="developer-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              required
              className="jc-input w-full"
              style={{ paddingLeft: "2.75rem" }}
              placeholder="Masukkan password developer"
            />
          </div>
        </div>
        {error && (
          <p role="alert" className="text-sm font-medium text-app-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2.5 border-t border-app-border pt-4">
          <button
            type="button"
            onClick={close}
            className="jc-focus rounded-xl border border-app-border bg-app-surface px-4 py-2.5 text-sm font-semibold text-app-fg transition-colors hover:bg-app-bg"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting || !password}
            className="jc-focus inline-flex items-center gap-1.5 rounded-xl bg-app-accent px-4 py-2.5 text-sm font-bold text-app-accent-fg transition-colors hover:bg-app-accent-strong disabled:opacity-60"
          >
            {submitting ? <span className="jc-spinner" /> : <ShieldCheck className="h-4 w-4" />}
            Verifikasi
          </button>
        </div>
      </form>
    </Modal>
  );
}
