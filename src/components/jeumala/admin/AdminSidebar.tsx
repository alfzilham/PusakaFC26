"use client";

import { Download, FileJson, FileSpreadsheet, LogOut, Menu, ReceiptText, Upload, X } from "lucide-react";
import { Logo } from "@/components/jeumala/Logo";
import { APP_NAME } from "@/lib/constants";

export type AdminView = "dashboard" | "generator" | "review";

export function AdminSidebar({ open, view, onClose, onView, onExport, onImport, onLogout }: {
  open: boolean;
  view: AdminView;
  onClose: () => void;
  onView: (view: AdminView) => void;
  onExport: (format: "xlsx" | "json") => void;
  onImport: () => void;
  onLogout: () => void;
}) {
  const item = (active: boolean) => `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${active ? "bg-app-accent text-app-accent-fg" : "text-app-fg-soft hover:bg-app-surface-2 hover:text-app-fg"}`;
  return (
    <>
      {open && <button type="button" aria-label="Tutup sidebar" onClick={onClose} className="fixed inset-0 z-40 bg-black/20 md:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-app-border bg-app-surface p-4 shadow-xl transition-transform duration-200 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-6 flex items-center justify-between border-b border-app-border pb-4">
          <div className="flex items-center gap-2.5"><Logo size={34} /><div className="leading-tight"><p className="text-sm font-extrabold text-app-fg">{APP_NAME}</p><p className="text-[11px] text-app-muted">Panel Admin</p></div></div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-app-muted hover:bg-app-surface-2 md:hidden"><X className="h-5 w-5" /></button>
        </div>
        <nav className="space-y-1">
          <button type="button" className={item(view === "dashboard")} onClick={() => { onView("dashboard"); onClose(); }}><Menu className="h-4 w-4" />Data Pendaftar</button>
          <button type="button" className={item(view === "generator")} onClick={() => { onView("generator"); onClose(); }}><ReceiptText className="h-4 w-4" />Struk Generator</button>
          <button type="button" className={item(view === "review")} onClick={() => { onView("review"); onClose(); }}><ReceiptText className="h-4 w-4" />Review Struk</button>
        </nav>
        <div className="my-5 border-t border-app-border" />
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-app-muted">Aksi data</p>
        <div className="space-y-1">
          <button type="button" className={item(false)} onClick={() => onExport("xlsx")}><FileSpreadsheet className="h-4 w-4" />Export .xlsx</button>
          <button type="button" className={item(false)} onClick={() => onExport("json")}><FileJson className="h-4 w-4" />Export .json</button>
          <button type="button" className={item(false)} onClick={onImport}><Upload className="h-4 w-4" />Import JSON</button>
        </div>
        <div className="mt-auto border-t border-app-border pt-4">
          <button type="button" className="flex w-full items-center gap-3 rounded-xl border border-app-danger/20 bg-app-danger-soft px-3 py-2.5 text-left text-sm font-semibold text-app-danger transition-colors hover:border-app-danger/40 hover:bg-app-danger/15" onClick={onLogout}><LogOut className="h-4 w-4" />Keluar</button>
        </div>
      </aside>
    </>
  );
}

export function AdminSidebarTrigger({ onClick }: { onClick: () => void }) {
  return <button type="button" aria-label="Buka sidebar admin" onClick={onClick} className="rounded-xl border border-app-border bg-app-surface p-2 text-app-fg shadow-sm md:hidden"><Menu className="h-5 w-5" /></button>;
}
