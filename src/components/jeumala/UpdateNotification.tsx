"use client";

import { useState } from "react";
import { BellRing, Check, X } from "lucide-react";
import { APP_VERSION, UPDATE_NOTIFICATION } from "@/lib/constants";

type Props = {
  audience: "public" | "admin";
};

export function UpdateNotification({ audience }: Props) {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return (
    <aside
      aria-label="Notifikasi pembaruan aplikasi"
      className="border-b border-app-accent/20 bg-app-accent-soft"
    >
      <div className="mx-auto flex max-w-6xl items-start gap-3 px-4 py-3 sm:px-6">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-app-accent text-app-accent-fg shadow-sm">
          <BellRing className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-extrabold text-app-accent">
              {UPDATE_NOTIFICATION.title}
            </p>
            <span className="rounded-full bg-app-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-app-accent">
              {APP_VERSION}
            </span>
            <span className="text-[11px] font-semibold text-app-accent/70">
              {audience === "admin" ? "Panel admin" : "Untuk pengguna"}
            </span>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-app-fg-soft">
            {UPDATE_NOTIFICATION.summary}
          </p>
          <ul className="mt-2 grid gap-1 text-xs text-app-fg-soft sm:grid-cols-3 sm:gap-x-4">
            {UPDATE_NOTIFICATION.items.map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-app-accent" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Tutup notifikasi pembaruan"
          className="jc-focus shrink-0 rounded-lg p-1.5 text-app-accent/70 transition-colors hover:bg-app-accent/10 hover:text-app-accent"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
