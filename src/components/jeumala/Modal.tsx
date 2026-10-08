"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

export function Modal({ open, onClose, title, icon, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="jc-overlay absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          "jc-pop-in jc-scroll relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-y-auto rounded-t-2xl border border-app-border bg-app-surface shadow-2xl sm:rounded-2xl"
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-app-border px-5 py-4">
          <h2 className="flex items-center gap-2.5 text-lg font-bold text-app-fg">
            {icon}
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="jc-focus inline-flex h-9 w-9 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-app-bg hover:text-app-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-5 text-sm leading-relaxed text-app-fg-soft">
          {children}
        </div>
        {footer && (
          <div className="border-t border-app-border px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
