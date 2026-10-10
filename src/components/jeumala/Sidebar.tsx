"use client";

import { useEffect, useState } from "react";
import {
  X,
  ClipboardList,
  ListOrdered,
  Lock,
  Info,
  ShieldAlert,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "./Logo";
import { Modal } from "./Modal";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type ViewKey = "form" | "numbers";
export type InfoKey = "about" | "privacy" | "terms" | "admin-contact" | "contact";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  current: ViewKey;
  onNavigate: (v: ViewKey) => void;
  onOpenInfo: (k: InfoKey) => void;
};

export function Sidebar({
  open,
  onClose,
  current,
  onNavigate,
  onOpenInfo,
}: SidebarProps) {
  const [closing, setClosing] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [accessNoticeOpen, setAccessNoticeOpen] = useState(false);

  function handleClose() {
    setClosing(true);
    window.setTimeout(() => {
      onClose();
      setClosing(false);
    }, 220);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function navigate(v: ViewKey) {
    onNavigate(v);
    handleClose();
  }

  if (!open && !closing) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu navigasi">
      <div
        className={`jc-overlay absolute inset-0 bg-black/40 backdrop-blur-[2px] ${closing ? "closing" : ""}`}
        onClick={handleClose}
      />
      <aside
        className={`jc-sidebar jc-scroll absolute right-0 top-0 flex h-full w-[84vw] max-w-sm flex-col overflow-y-auto border-l border-app-border bg-app-surface shadow-2xl ${closing ? "closing" : ""}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-app-border px-5 py-5">
          <div className="flex items-center gap-2.5">
            <Logo size={36} />
            <span className="text-lg font-extrabold tracking-tight text-app-fg">
              {APP_NAME}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup menu"
            className="jc-focus inline-flex h-9 w-9 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-app-bg hover:text-app-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4" aria-label="Navigasi utama">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-app-muted">
            Menu
          </p>
          <NavItem
            icon={ClipboardList}
            label="Form Pendaftaran Jersey"
            active={current === "form"}
            onClick={() => navigate("form")}
          />
          <NavItem
            icon={ListOrdered}
            label="Nomor Punggung Terpakai"
            active={current === "numbers"}
            onClick={() => navigate("numbers")}
          />
          <NavItem
            icon={Lock}
            label="Lihat Detail Data"
            onClick={() => setAccessNoticeOpen(true)}
          />

          {/* Information — sticky bottom */}
          <div className="sticky bottom-0 mt-4 border-t border-app-border bg-app-surface px-3 pt-3 pb-4">
            <button
              type="button"
              onClick={() => setInfoOpen((v) => !v)}
              aria-expanded={infoOpen}
              aria-controls="info-submenu"
              className={cn(
                "jc-focus flex w-full items-center justify-between gap-2 rounded-xl px-3 py-3 text-left text-sm font-semibold text-app-fg transition-colors hover:bg-app-bg",
                infoOpen && "bg-app-bg"
              )}
            >
              <span className="flex items-center gap-3">
                <Info className="h-5 w-5 text-app-accent" />
                Information
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-app-muted transition-transform duration-200",
                  infoOpen && "rotate-180"
                )}
              />
            </button>
            {infoOpen && (
              <div
                id="info-submenu"
                className="jc-pop-in mt-1.5 flex flex-col gap-0.5 pl-2"
              >
                <InfoSubItem label="About" onClick={() => { onOpenInfo("about"); handleClose(); }} />
                <InfoSubItem label="Privacy Policy" onClick={() => { onOpenInfo("privacy"); handleClose(); }} />
                <InfoSubItem label="Terms of Services" onClick={() => { onOpenInfo("terms"); handleClose(); }} />
                <InfoSubItem label="Admin Contact" onClick={() => { onOpenInfo("admin-contact"); handleClose(); }} />
                <InfoSubItem label="Super Admin Contact" onClick={() => { onOpenInfo("contact"); handleClose(); }} />
              </div>
            )}
          </div>
        </nav>
      </aside>
      <Modal
        open={accessNoticeOpen}
        onClose={() => setAccessNoticeOpen(false)}
        title="Akses terbatas"
        icon={<ShieldAlert className="h-5 w-5 text-app-danger" />}
        footer={
          <button
            type="button"
            onClick={() => setAccessNoticeOpen(false)}
            className="jc-focus w-full rounded-xl bg-app-accent px-4 py-2.5 text-sm font-bold text-app-accent-fg transition-colors hover:bg-app-accent-strong"
          >
            Mengerti
          </button>
        }
      >
        Fitur detail data hanya dapat diakses oleh admin dan super admin. Silakan
        gunakan halaman admin untuk melanjutkan.
      </Modal>
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
  disabled,
  disabledHint,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  disabledHint?: string;
  onClick?: () => void;
}) {
  if (disabled) {
    return (
      <div
        aria-disabled="true"
        role="link"
        aria-label={`${label} (dinonaktifkan)`}
        title={disabledHint}
        className="mb-0.5 flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-app-muted/60"
      >
        <Icon className="h-5 w-5" />
        <span className="flex-1">{label}</span>
        <span className="rounded-md bg-app-bg px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-app-muted">
          Lock
        </span>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "jc-focus mb-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors",
        active
          ? "bg-app-accent/10 text-app-accent-strong"
          : "text-app-fg hover:bg-app-bg"
      )}
    >
      <Icon className={cn("h-5 w-5", active ? "text-app-accent" : "text-app-muted")} />
      <span className="flex-1">{label}</span>
      {active && <span className="h-1.5 w-1.5 rounded-full bg-app-accent" />}
    </button>
  );
}

function InfoSubItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="jc-focus flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-app-fg-soft transition-colors hover:bg-app-bg hover:text-app-fg"
    >
      <span className="h-1 w-1 rounded-full bg-app-muted" />
      {label}
    </button>
  );
}
