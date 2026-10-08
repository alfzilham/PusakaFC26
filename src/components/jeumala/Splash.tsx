"use client";

import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { APP_NAME } from "@/lib/constants";

export function Splash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Hold the splash, then fade out.
    const t1 = setTimeout(() => setLeaving(true), 1500);
    const t2 = setTimeout(() => onDone(), 1950);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div
      className={`jc-splash ${leaving ? "fade-out" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={`${APP_NAME} sedang dimuat`}
    >
      <div className="jc-splash-logo">
        <Logo size={164} variant="light" />
      </div>
      <div className="jc-splash-word text-center">
        <p
          className="text-2xl font-extrabold tracking-tight text-app-accent-strong"
          style={{ letterSpacing: "-0.01em" }}
        >
          {APP_NAME}
        </p>
        <p className="mt-1 text-sm font-medium text-app-muted">
          Pendaftaran Jersey
        </p>
      </div>
    </div>
  );
}
