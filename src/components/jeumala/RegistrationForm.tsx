"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  User,
  Shirt,
  Hash,
  Ruler,
  Wind,
  Send,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import { CustomDropdown } from "./CustomDropdown";
import { useToast } from "./Toast";
import {
  GENDER_LABEL,
  GENDER_VALUES,
  SIZE_LABEL,
  SIZE_VALUES,
  SLEEVE_LABEL,
  SLEEVE_VALUES,
  type Gender,
  type UsedEntry,
} from "@/lib/validations";
import { DEVELOPER } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  used: UsedEntry[];
  onAfterSubmit: () => void;
};

type Fields = {
  gender: string;
  fullName: string;
  backName: string;
  backNumber: string;
  size: string;
  sleeve: string;
};

const EMPTY: Fields = {
  gender: "",
  fullName: "",
  backName: "",
  backNumber: "",
  size: "",
  sleeve: "",
};

function normalizeBackName(s: string) {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

export function RegistrationForm({ used, onAfterSubmit }: Props) {
  const { show } = useToast();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Indexes for O(1) duplicate lookup against the client cache
  const { nameSet, numberSet } = useMemo(() => {
    const nameSet = new Set<string>();
    const numberSet = new Set<number>();
    for (const e of used) {
      nameSet.add(normalizeBackName(e.backName));
      numberSet.add(e.backNumber);
    }
    return { nameSet, numberSet };
  }, [used]);

  // ---- field-level validation ----
  function validate(f: Fields) {
    const e: Partial<Record<keyof Fields, string>> = {};

    if (!f.gender) e.gender = "Gender wajib dipilih";
    else if (!(GENDER_VALUES as readonly string[]).includes(f.gender))
      e.gender = "Gender tidak valid";

    if (!f.fullName.trim()) e.fullName = "Nama lengkap wajib diisi";
    else if (f.fullName.trim().length < 3)
      e.fullName = "Minimal 3 karakter";
    else if (f.fullName.trim().length > 80)
      e.fullName = "Maksimal 80 karakter";

    const bn = f.backName.trim();
    if (!bn) e.backName = "Nama belakang wajib diisi";
    else if (bn.length < 2) e.backName = "Minimal 2 karakter";
    else if (bn.length > 20) e.backName = "Maksimal 20 karakter";
    else if (!/^[A-Za-z0-9 ]+$/.test(bn))
      e.backName = "Hanya huruf, angka, dan spasi";
    else if (nameSet.has(normalizeBackName(bn)))
      e.backName = "Nama belakang sudah dipakai";

    const numStr = f.backNumber.trim();
    if (!numStr) e.backNumber = "Nomor wajib diisi";
    else if (!/^\d+$/.test(numStr)) e.backNumber = "Harus berupa angka";
    else {
      const n = parseInt(numStr, 10);
      if (n < 1) e.backNumber = "Minimal 1";
      else if (n > 999) e.backNumber = "Maksimal 999";
      else if (numberSet.has(n)) e.backNumber = "Nomor sudah dipakai";
    }

    if (!f.size) e.size = "Ukuran wajib dipilih";
    if (!f.sleeve) e.sleeve = "Panjang lengan wajib dipilih";

    return e;
  }

  const errors = validate(fields);
  const isValid = Object.keys(errors).length === 0;

  function setField<K extends keyof Fields>(key: K, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    setSubmitError(null);
  }

  function markTouched(key: keyof Fields) {
    setTouched((t) => ({ ...t, [key]: true }));
  }

  function shouldShow(key: keyof Fields) {
    return touched[key] && errors[key];
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting || !isValid) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gender: fields.gender,
          fullName: fields.fullName.trim(),
          backName: fields.backName.trim(),
          backNumber: parseInt(fields.backNumber, 10),
          size: fields.size,
          sleeve: fields.sleeve,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.error || "Gagal mendaftar. Silakan coba lagi.";
        setSubmitError(msg);
        show({ variant: "error", title: "Pendaftaran gagal", description: msg });

        // If duplicate detected server-side, mark field touched to show inline error
        if (data?.field === "backName") {
          setTouched((t) => ({ ...t, backName: true }));
        } else if (data?.field === "backNumber") {
          setTouched((t) => ({ ...t, backNumber: true }));
        }
        return;
      }

      // Success
      show({
        variant: "success",
        title: "Pendaftaran berhasil!",
        description: "Data jersey Anda telah tersimpan.",
      });
      setFields(EMPTY);
      setTouched({});
      onAfterSubmit(); // refetch cache
    } catch {
      setSubmitError("Koneksi gagal. Periksa internet Anda lalu coba lagi.");
      show({
        variant: "error",
        title: "Koneksi gagal",
        description: "Periksa internet Anda lalu coba lagi.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-app-fg sm:text-3xl">
          Form Pendaftaran Jersey
        </h1>
        <p className="mt-1.5 text-sm text-app-muted">
          Lengkapi data di bawah ini. Nama & nomor punggung bersifat{" "}
          <strong className="font-semibold text-app-fg-soft">unik global</strong>.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5 rounded-2xl border border-app-border bg-app-surface p-5 shadow-sm sm:p-6"
      >
        {/* Gender */}
        <CustomDropdown
          label="Gender"
          required
          value={fields.gender}
          onChange={(v) => setField("gender", v)}
          options={GENDER_VALUES.map((g) => ({ value: g, label: GENDER_LABEL[g] }))}
          placeholder="Pilih gender"
          invalid={!!shouldShow("gender")}
          errorText={errors.gender}
        />

        {/* Nama Lengkap */}
        <TextField
          id="fullName"
          label="Nama Lengkap"
          required
          icon={<User className="h-4 w-4" />}
          value={fields.fullName}
          onChange={(v) => setField("fullName", v)}
          onBlur={() => markTouched("fullName")}
          placeholder="Contoh: Budi Santoso"
          maxLength={80}
          invalid={!!shouldShow("fullName")}
          errorText={errors.fullName}
          autoComplete="name"
        />

        {/* Nama Belakang */}
        <TextField
          id="backName"
          label="Nama Belakang Baju"
          required
          icon={<Shirt className="h-4 w-4" />}
          value={fields.backName}
          onChange={(v) => setField("backName", v)}
          onBlur={() => markTouched("backName")}
          placeholder="2–20 karakter, huruf/angka/spasi"
          maxLength={20}
          invalid={!!shouldShow("backName")}
          errorText={errors.backName}
          hint="A dicetak di punggung jersey. Bersifat unik global."
          characterCount={`${fields.backName.trim().length}/20`}
        />

        {/* No. Belakang */}
        <TextField
          id="backNumber"
          label="No. Belakang Baju"
          required
          icon={<Hash className="h-4 w-4" />}
          value={fields.backNumber}
          onChange={(v) => setField("backNumber", v.replace(/[^\d]/g, ""))}
          onBlur={() => markTouched("backNumber")}
          placeholder="1–999"
          inputMode="numeric"
          invalid={!!shouldShow("backNumber")}
          errorText={errors.backNumber}
          hint="Bilangan bulat 1–999, unik global."
        />

        {/* Ukuran */}
        <CustomDropdown
          label="Ukuran"
          required
          value={fields.size}
          onChange={(v) => setField("size", v)}
          options={SIZE_VALUES.map((s) => ({ value: s, label: SIZE_LABEL[s] }))}
          placeholder="Pilih ukuran"
          invalid={!!shouldShow("size")}
          errorText={errors.size}
        />

        {/* Lengan */}
        <CustomDropdown
          label="Panjang/Pendek Lengan"
          required
          value={fields.sleeve}
          onChange={(v) => setField("sleeve", v)}
          options={SLEEVE_VALUES.map((s) => ({ value: s, label: SLEEVE_LABEL[s] }))}
          placeholder="Pilih panjang lengan"
          invalid={!!shouldShow("sleeve")}
          errorText={errors.sleeve}
        />

        {/* Submit error banner */}
        {submitError && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2.5 rounded-xl border border-app-danger/30 bg-app-danger-soft p-3.5 text-sm font-medium text-app-danger"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValid || submitting}
          aria-disabled={!isValid || submitting}
          className={cn(
            "jc-focus relative flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-3.5 text-sm font-bold transition-all",
            !isValid || submitting
              ? "cursor-not-allowed bg-app-border text-app-muted"
              : "bg-app-accent text-app-accent-fg shadow-sm hover:bg-app-accent-strong active:scale-[0.99]"
          )}
        >
          {submitting ? (
            <>
              <span className="jc-spinner" />
              <span>Menyimpan…</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Daftarkan Jersey</span>
            </>
          )}
        </button>

        {/* Correction note */}
        <div className="flex items-start gap-2.5 rounded-xl border border-app-border bg-app-surface-2 p-3.5 text-xs text-app-muted">
          <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-app-accent" />
          <p>
            Data yang sudah disimpan <strong className="font-semibold text-app-fg-soft">tidak dapat diedit/dibatalkan</strong> sendiri.
            Untuk koreksi, hubungi admin atau developer via WhatsApp:{" "}
            <a
              href={DEVELOPER.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-app-accent underline underline-offset-2"
            >
              {DEVELOPER.whatsapp}
            </a>
            .
          </p>
        </div>
      </form>
    </div>
  );
}

// ---- Text field with icon + validation UI ----
function TextField({
  id,
  label,
  required,
  icon,
  value,
  onChange,
  onBlur,
  placeholder,
  maxLength,
  inputMode,
  invalid,
  errorText,
  hint,
  characterCount,
  autoComplete,
}: {
  id: string;
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  maxLength?: number;
  inputMode?: "text" | "numeric";
  invalid?: boolean;
  errorText?: string;
  hint?: string;
  characterCount?: string;
  autoComplete?: string;
}) {
  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between">
        <label
          htmlFor={id}
          className="flex items-center gap-1 text-sm font-semibold text-app-fg"
        >
          {label}
          {required && (
            <span className="text-app-danger" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {characterCount && (
          <span className="text-xs tabular-nums text-app-muted">
            {characterCount}
          </span>
        )}
      </div>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={inputMode === "numeric" ? "text" : "text"}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          aria-describedby={
            [hint ? `${id}-hint` : null, invalid && errorText ? `${id}-err` : null]
              .filter(Boolean)
              .join(" ") || undefined
          }
          className={cn(
            "jc-focus w-full rounded-xl border bg-app-surface py-3 text-sm font-medium text-app-fg transition-colors placeholder:font-normal placeholder:text-app-muted",
            icon ? "pl-10 pr-3.5" : "px-3.5",
            invalid
              ? "border-app-danger ring-1 ring-app-danger/30"
              : "border-app-border hover:border-app-border-strong focus:border-app-accent"
          )}
        />
      </div>
      {hint && !invalid && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-app-muted">
          {hint}
        </p>
      )}
      {invalid && errorText && (
        <p
          id={`${id}-err`}
          role="alert"
          aria-live="polite"
          className="mt-1.5 flex items-center gap-1 text-xs font-medium text-app-danger"
        >
          <AlertCircle className="h-3.5 w-3.5" />
          {errorText}
        </p>
      )}
    </div>
  );
}

// Keep Gender type referenced for build
export type { Gender };
