"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { UPDATE_NOTIFICATION } from "@/lib/constants";

export function UpdateNotification() {
  const [leaving, setLeaving] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hideTimer = window.setTimeout(() => {
      setLeaving(true);
      window.setTimeout(() => setVisible(false), 450);
    }, 5000);

    return () => window.clearTimeout(hideTimer);
  }, []);

  if (!visible) return null;

  return (
    <a
      href={UPDATE_NOTIFICATION.href}
      target="_blank"
      rel="noreferrer"
      aria-label="Lihat changelog JeumalaCup di GitHub"
      className={`jc-update-card jc-focus fixed left-4 top-4 z-[80] flex w-[min(290px,calc(100vw-2rem))] items-center gap-3 rounded-xl border border-app-accent/20 bg-app-surface px-4 py-3 shadow-lg transition-shadow hover:shadow-xl${
        leaving ? " jc-update-card-leaving" : ""
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold text-app-accent">
          {UPDATE_NOTIFICATION.label}
        </span>
        <span className="mt-0.5 block text-xs text-app-muted">
          {UPDATE_NOTIFICATION.summary}
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-app-accent" aria-hidden="true" />
    </a>
  );
}
