"use client";

import { useState, type FormEvent } from "react";
import { Lock, Eye, EyeOff, ShieldAlert, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/jeumala/Logo";
import { APP_NAME, LOGIN_MAX_ATTEMPTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  onSuccess: () => void;
  onBack: () => void;
};

export function AdminLogin({ onSuccess, onBack }: Props) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading || !password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPassword("");
        onSuccess();
        return;
      }
      if (res.status === 429) {
        setLockedUntil(data.retryAfterMs || 15 * 60 * 1000);
        setError(data.error || "Terlalu banyak percobaan. Coba lagi nanti.");
      } else {
        setLockedUntil(null);
        setError(data.error || "Password salah.");
      }
    } catch {
      setError("Koneksi gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <button
          type="button"
          onClick={onBack}
          className="jc-focus mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-app-muted transition-colors hover:text-app-fg"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke beranda
        </button>

        <div className="rounded-2xl border border-app-border bg-app-surface p-6 shadow-lg sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-app-accent/10">
              <Logo size={40} />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-app-fg">
              Admin {APP_NAME}
            </h1>
            <p className="mt-1 text-sm text-app-muted">
              Masukkan password untuk mengakses panel.
            </p>
          </div>

          {lockedUntil && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-xl border border-app-danger/30 bg-app-danger-soft p-3.5 text-sm font-medium text-app-danger"
            >
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-app-fg"
              >
                Password
                <span className="text-app-danger" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" />
                <input
                  id="admin-password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={!!lockedUntil}
                  aria-invalid={!!error || undefined}
                  className={cn(
                    "jc-focus w-full rounded-xl border bg-app-surface py-3 pl-10 pr-11 text-sm font-medium text-app-fg transition-colors placeholder:font-normal placeholder:text-app-muted",
                    error
                      ? "border-app-danger ring-1 ring-app-danger/30"
                      : "border-app-border hover:border-app-border-strong focus:border-app-accent",
                    lockedUntil && "opacity-55"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
                  className="jc-focus absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-app-muted transition-colors hover:bg-app-bg hover:text-app-fg"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {error && !lockedUntil && (
                <p
                  role="alert"
                  aria-live="polite"
                  className="mt-1.5 text-xs font-medium text-app-danger"
                >
                  {error}
                </p>
              )}
              <p className="mt-1.5 text-xs text-app-muted">
                Maksimum {LOGIN_MAX_ATTEMPTS} percobaan gagal sebelum terkunci 15 menit.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !password || !!lockedUntil}
              className={cn(
                "jc-focus flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition-all",
                loading || !password || lockedUntil
                  ? "cursor-not-allowed bg-app-border text-app-muted"
                  : "bg-app-accent text-app-accent-fg shadow-sm hover:bg-app-accent-strong active:scale-[0.99]"
              )}
            >
              {loading ? (
                <>
                  <span className="jc-spinner" />
                  <span>Memverifikasi…</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Masuk</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
