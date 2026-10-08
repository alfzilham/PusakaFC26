"use client";

import { useMemo, useState } from "react";
import { Hash, Users, Search, Inbox } from "lucide-react";
import {
  GENDER_LABEL,
  type Gender,
  type UsedEntry,
} from "@/lib/validations";
import { cn } from "@/lib/utils";

type Props = {
  used: UsedEntry[];
};

export function UsedNumbersList({ used }: Props) {
  const [query, setQuery] = useState("");

  const sorted = useMemo(
    () => [...used].sort((a, b) => a.backNumber - b.backNumber),
    [used]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (e) =>
        String(e.backNumber).includes(q) ||
        e.backName.toLowerCase().includes(q)
    );
  }, [sorted, query]);

  const priaCount = used.filter((e) => e.gender === "PRIA").length;
  const wanitaCount = used.filter((e) => e.gender === "WANITA").length;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-app-fg sm:text-3xl">
          Nomor Punggung Terpakai
        </h1>
        <p className="mt-1.5 text-sm text-app-muted">
          Daftar gabungan seluruh nomor punggung yang sudah terdaftar.
        </p>
      </header>

      {/* Summary chips */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <SummaryCard
          icon={<Hash className="h-4 w-4" />}
          label="Total"
          value={used.length}
          tone="neutral"
        />
        <SummaryCard
          icon={<Users className="h-4 w-4" />}
          label="Pria"
          value={priaCount}
          tone="pria"
        />
        <SummaryCard
          icon={<Users className="h-4 w-4" />}
          label="Wanita"
          value={wanitaCount}
          tone="wanita"
        />
      </div>

      {/* Search (display-only convenience, no mutations) */}
      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nomor atau nama belakang…"
          aria-label="Cari nomor atau nama belakang"
          className="jc-focus w-full rounded-xl border border-app-border bg-app-surface py-3 pl-10 pr-3.5 text-sm font-medium text-app-fg transition-colors placeholder:font-normal placeholder:text-app-muted hover:border-app-border-strong focus:border-app-accent"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-app-border bg-app-surface py-16 text-center">
          <Inbox className="h-10 w-10 text-app-muted" />
          <div>
            <p className="font-semibold text-app-fg">
              {used.length === 0 ? "Belum ada nomor terdaftar" : "Tidak ditemukan"}
            </p>
            <p className="mt-0.5 text-sm text-app-muted">
              {used.length === 0
                ? "Jadilah yang pertama mendaftar!"
                : "Coba kata kunci lain."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((e) => (
            <NumberCard key={e.id} entry={e} />
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-app-muted">
        Data bersifat read-only. Untuk koreksi, hubungi admin.
      </p>
    </div>
  );
}

function NumberCard({ entry }: { entry: UsedEntry }) {
  const gender = entry.gender as Gender;
  const isPria = gender === "PRIA";
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2 overflow-hidden rounded-xl border bg-app-surface p-3.5 shadow-sm transition-all hover:shadow-md",
        isPria ? "border-app-pria/25" : "border-app-wanita/25"
      )}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          isPria ? "bg-app-pria" : "bg-app-wanita"
        )}
      />
      <div className="flex items-baseline justify-between pl-1.5">
        <span className="text-2xl font-extrabold tabular-nums text-app-fg">
          {entry.backNumber}
        </span>
        <GenderBadge gender={gender} />
      </div>
      <p className="truncate pl-1.5 text-sm font-semibold text-app-fg-soft">
        {entry.backName}
      </p>
    </div>
  );
}

export function GenderBadge({ gender }: { gender: Gender }) {
  const isPria = gender === "PRIA";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        isPria
          ? "bg-app-pria-soft text-app-pria-fg"
          : "bg-app-wanita-soft text-app-wanita-fg"
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", isPria ? "bg-app-pria" : "bg-app-wanita")}
        aria-hidden="true"
      />
      {GENDER_LABEL[gender]}
    </span>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "neutral" | "pria" | "wanita";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border bg-app-surface p-3.5 shadow-sm",
        tone === "pria" && "border-app-pria/25",
        tone === "wanita" && "border-app-wanita/25",
        tone === "neutral" && "border-app-border"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg",
          tone === "pria" && "bg-app-pria-soft text-app-pria",
          tone === "wanita" && "bg-app-wanita-soft text-app-wanita",
          tone === "neutral" && "bg-app-accent/10 text-app-accent"
        )}
      >
        {icon}
      </span>
      <div>
        <p className="text-xl font-extrabold tabular-nums leading-none text-app-fg">
          {value}
        </p>
        <p className="mt-1 text-xs text-app-muted">{label}</p>
      </div>
    </div>
  );
}
