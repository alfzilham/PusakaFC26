"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Download,
  FileJson,
  FileSpreadsheet,
  LogOut,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Inbox,
} from "lucide-react";
import { Logo } from "@/components/jeumala/Logo";
import { CustomDropdown } from "@/components/jeumala/CustomDropdown";
import { CustomCheckbox } from "@/components/jeumala/CustomCheckbox";
import { Modal } from "@/components/jeumala/Modal";
import { GenderBadge } from "@/components/jeumala/UsedNumbersList";
import { useToast } from "@/components/jeumala/Toast";
import { APP_NAME } from "@/lib/constants";
import {
  GENDER_LABEL,
  GENDER_VALUES,
  SIZE_LABEL,
  SIZE_VALUES,
  SLEEVE_LABEL,
  SLEEVE_VALUES,
  type OrderRow,
} from "@/lib/validations";
import { cn } from "@/lib/utils";
import { DeveloperVerificationModal } from "@/components/jeumala/admin/DeveloperVerificationModal";

type Stats = { total: number; pria: number; wanita: number };

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { show } = useToast();
  const [stats, setStats] = useState<Stats>({ total: 0, pria: 0, wanita: 0 });
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState("");
  const [filterPria, setFilterPria] = useState(false);
  const [filterWanita, setFilterWanita] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<null | "xlsx" | "json">(null);

  const [editing, setEditing] = useState<OrderRow | null>(null);
  const [deleting, setDeleting] = useState<OrderRow | null>(null);
  const [developerPrompt, setDeveloperPrompt] = useState<string | null>(null);
  const [developerVerified, setDeveloperVerified] = useState(false);
  const pendingDeveloperAction = useRef<(() => void | Promise<void>) | null>(null);

  // Derived gender filter for API
  const genderParam = (() => {
    if (filterPria && !filterWanita) return "PRIA";
    if (filterWanita && !filterPria) return "WANITA";
    return ""; // both or none → all
  })();

  const fetchTable = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (genderParam) params.set("gender", genderParam);
      params.set("page", String(page));
      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setRows(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
    } catch {
      show({ variant: "error", title: "Gagal memuat data." });
    } finally {
      setLoading(false);
    }
  }, [query, genderParam, page, show]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setStats(json);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchTable();
  }, [fetchTable]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchTable();
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    fetchTable();
  }, [genderParam, page]);

  function refreshAll() {
    fetchTable();
    fetchStats();
  }

  function requireDeveloper(actionLabel: string, action: () => void | Promise<void>) {
    if (developerVerified) {
      void action();
      return;
    }
    pendingDeveloperAction.current = action;
    setDeveloperPrompt(actionLabel);
  }

  function handleDeveloperVerified() {
    setDeveloperVerified(true);
    setDeveloperPrompt(null);
    const action = pendingDeveloperAction.current;
    pendingDeveloperAction.current = null;
    if (action) void action();
  }

  async function handleExport(fmt: "xlsx" | "json") {
    setExporting(fmt);
    try {
      const res = await fetch(`/api/admin/export?format=${fmt}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pusakafc26-${Date.now()}.${fmt}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      show({
        variant: "success",
        title: fmt === "xlsx" ? "Export Excel berhasil" : "Export JSON berhasil",
      });
    } catch {
      show({ variant: "error", title: "Export gagal. Coba lagi." });
    } finally {
      setExporting(null);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    onLogout();
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      const res = await fetch(`/api/admin/orders?id=${deleting.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error);
      }
      show({ variant: "success", title: "Data dihapus." });
      setDeleting(null);
      refreshAll();
    } catch {
      show({ variant: "error", title: "Gagal menghapus data." });
    }
  }

  function handleEditSaved() {
    setEditing(null);
    refreshAll();
  }

  return (
    <div className="min-h-screen">
      {/* Admin top bar */}
      <header className="sticky top-0 z-40 border-b border-app-border bg-app-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Logo size={32} />
            <div className="leading-tight">
              <p className="text-sm font-extrabold tracking-tight text-app-fg">
                {APP_NAME}
              </p>
              <p className="text-[11px] text-app-muted">Panel Admin · Read-only</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="jc-focus inline-flex items-center gap-1.5 rounded-xl border border-app-border bg-app-surface px-3 py-2 text-sm font-semibold text-app-fg transition-colors hover:border-app-danger/40 hover:text-app-danger"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Stats */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Total Entri"
            value={stats.total}
            tone="accent"
          />
          <StatCard
            icon={<UserCheck className="h-5 w-5" />}
            label="Total Pria"
            value={stats.pria}
            tone="pria"
          />
          <StatCard
            icon={<UserX className="h-5 w-5" />}
            label="Total Wanita"
            value={stats.wanita}
            tone="wanita"
          />
        </section>

        {/* Export + refresh */}
        <section className="mb-6 flex flex-wrap items-center gap-3">
          <h2 className="mr-auto text-lg font-bold text-app-fg">Data Pendaftar</h2>
          <p className="basis-full text-xs text-app-muted">
            Admin dapat melihat data. Export, edit, dan hapus hanya tersedia untuk developer.
          </p>
          <p className="basis-full text-xs text-app-muted">
            No. Urut mengikuti waktu submit dan tidak dapat diedit. No. Punggung adalah nomor jersey.
          </p>
          <button
            type="button"
            onClick={refreshAll}
            disabled={loading}
            className="jc-focus inline-flex items-center gap-1.5 rounded-xl border border-app-border bg-app-surface px-3 py-2 text-sm font-semibold text-app-fg transition-colors hover:border-app-border-strong"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => requireDeveloper("export Excel", () => handleExport("xlsx"))}
            disabled={!!exporting}
            className="jc-focus inline-flex items-center gap-1.5 rounded-xl bg-app-accent px-3.5 py-2 text-sm font-semibold text-app-accent-fg transition-colors hover:bg-app-accent-strong disabled:opacity-60"
          >
            {exporting === "xlsx" ? (
              <span className="jc-spinner" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            <span>Export .xlsx</span>
          </button>
          <button
            type="button"
            onClick={() => requireDeveloper("export JSON", () => handleExport("json"))}
            disabled={!!exporting}
            className="jc-focus inline-flex items-center gap-1.5 rounded-xl border border-app-border bg-app-surface px-3.5 py-2 text-sm font-semibold text-app-fg transition-colors hover:border-app-border-strong disabled:opacity-60"
          >
            {exporting === "json" ? (
              <span className="jc-spinner" />
            ) : (
              <FileJson className="h-4 w-4" />
            )}
            <span>Export .json</span>
          </button>
        </section>

        {/* Search + filter */}
        <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama lengkap / nama belakang / nomor…"
              aria-label="Cari data"
              className="jc-focus w-full rounded-xl border border-app-border bg-app-surface py-2.5 pl-10 pr-3.5 text-sm font-medium text-app-fg transition-colors placeholder:font-normal placeholder:text-app-muted hover:border-app-border-strong focus:border-app-accent"
            />
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-app-border bg-app-surface px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">
              Filter
            </span>
            <CustomCheckbox
              label="Pria"
              checked={filterPria}
              onChange={setFilterPria}
            />
            <CustomCheckbox
              label="Wanita"
              checked={filterWanita}
              onChange={setFilterWanita}
            />
          </div>
        </section>

        {/* Table */}
        <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm">
          <div className="jc-scroll overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-app-border bg-app-surface-2 text-xs uppercase tracking-wide text-app-muted">
                  <th className="px-4 py-3 font-semibold">No. Urut</th>
                  <th className="px-4 py-3 font-semibold">Gender</th>
                  <th className="px-4 py-3 font-semibold">Nama Lengkap</th>
                  <th className="px-4 py-3 font-semibold">Nama Belakang</th>
                  <th className="px-4 py-3 font-semibold">No. Punggung</th>
                  <th className="px-4 py-3 font-semibold">Ukuran</th>
                  <th className="px-4 py-3 font-semibold">Lengan</th>
                  <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-app-muted">
                      <span className="jc-spinner" />
                      <p className="mt-3">Memuat data…</p>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16">
                      <div className="flex flex-col items-center gap-2 text-center">
                        <Inbox className="h-8 w-8 text-app-muted" />
                        <p className="font-semibold text-app-fg">Tidak ada data</p>
                        <p className="text-sm text-app-muted">
                          Belum ada entri yang cocok dengan filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-app-border/70 transition-colors last:border-0 hover:bg-app-surface-2"
                    >
                      <td className="px-4 py-3 font-bold tabular-nums text-app-fg">
                        {r.sequenceNumber ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <GenderBadge gender={r.gender} />
                      </td>
                      <td className="px-4 py-3 font-medium text-app-fg">
                        {r.fullName}
                      </td>
                      <td className="px-4 py-3 font-medium text-app-fg-soft">
                        {r.backName}
                      </td>
                      <td className="px-4 py-3 font-bold tabular-nums text-app-fg">
                        {r.backNumber}
                      </td>
                      <td className="px-4 py-3 text-app-fg-soft">
                        {SIZE_LABEL[r.size]}
                      </td>
                      <td className="px-4 py-3 text-app-fg-soft">
                        {SLEEVE_LABEL[r.sleeve]}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => requireDeveloper("mengedit data", () => setEditing(r))}
                            aria-label={`Edit ${r.fullName}`}
                            className="jc-focus inline-flex h-8 w-8 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-app-accent/10 hover:text-app-accent"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => requireDeveloper("menghapus data", () => setDeleting(r))}
                            aria-label={`Hapus ${r.fullName}`}
                            className="jc-focus inline-flex h-8 w-8 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-app-danger/10 hover:text-app-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-3 border-t border-app-border px-4 py-3">
            <p className="text-xs text-app-muted">
              {loading
                ? "Memuat…"
                : `${(page - 1) * 20 + (rows.length ? 1 : 0)}–${
                    (page - 1) * 20 + rows.length
                  } dari ${total} entri`}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="jc-focus inline-flex h-8 w-8 items-center justify-center rounded-lg border border-app-border text-app-fg transition-colors hover:bg-app-bg disabled:opacity-40"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-sm font-semibold tabular-nums text-app-fg">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="jc-focus inline-flex h-8 w-8 items-center justify-center rounded-lg border border-app-border text-app-fg transition-colors hover:bg-app-bg disabled:opacity-40"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Edit modal */}
      {editing && (
        <EditOrderModal
          order={editing}
          onClose={() => setEditing(null)}
          onSaved={handleEditSaved}
        />
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Konfirmasi Hapus"
        icon={<AlertTriangle className="h-5 w-5 text-app-danger" />}
        footer={
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setDeleting(null)}
              className="jc-focus rounded-xl border border-app-border bg-app-surface px-4 py-2.5 text-sm font-semibold text-app-fg transition-colors hover:bg-app-bg"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="jc-focus inline-flex items-center gap-1.5 rounded-xl bg-app-danger px-4 py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90"
            >
              <Trash2 className="h-4 w-4" />
              Hapus
            </button>
          </div>
        }
      >
        {deleting && (
          <p>
            Yakin ingin menghapus data <strong>{deleting.fullName}</strong> (No. Punggung{" "}
            <strong>{deleting.backNumber}</strong> — {deleting.backName})? Tindakan
            ini tidak dapat dibatalkan.
          </p>
        )}
      </Modal>

      <DeveloperVerificationModal
        open={!!developerPrompt}
        actionLabel={developerPrompt || "fitur terbatas"}
        onClose={() => {
          pendingDeveloperAction.current = null;
          setDeveloperPrompt(null);
        }}
        onVerified={handleDeveloperVerified}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "accent" | "pria" | "wanita";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border bg-app-surface p-5 shadow-sm",
        tone === "pria" && "border-app-pria/25",
        tone === "wanita" && "border-app-wanita/25",
        tone === "accent" && "border-app-border"
      )}
    >
      <span
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl",
          tone === "pria" && "bg-app-pria-soft text-app-pria",
          tone === "wanita" && "bg-app-wanita-soft text-app-wanita",
          tone === "accent" && "bg-app-accent/10 text-app-accent"
        )}
      >
        {icon}
      </span>
      <div>
        <p className="text-3xl font-extrabold tabular-nums leading-none text-app-fg">
          {value}
        </p>
        <p className="mt-1.5 text-sm text-app-muted">{label}</p>
      </div>
    </div>
  );
}

// ---- Edit modal ----
function EditOrderModal({
  order,
  onClose,
  onSaved,
}: {
  order: OrderRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { show } = useToast();
  const [gender, setGender] = useState(order.gender);
  const [fullName, setFullName] = useState(order.fullName);
  const [backName, setBackName] = useState(order.backName);
  const [backNumber, setBackNumber] = useState(String(order.backNumber));
  const [size, setSize] = useState(order.size);
  const [sleeve, setSleeve] = useState(order.sleeve);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/orders?id=${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gender,
          fullName: fullName.trim(),
          backName: backName.trim(),
          backNumber: parseInt(backNumber, 10),
          size,
          sleeve,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Gagal menyimpan.");
        return;
      }
      show({ variant: "success", title: "Perubahan tersimpan." });
      onSaved();
    } catch {
      setErr("Koneksi gagal.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit Data"
      icon={<Pencil className="h-5 w-5 text-app-accent" />}
      footer={
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="jc-focus rounded-xl border border-app-border bg-app-surface px-4 py-2.5 text-sm font-semibold text-app-fg transition-colors hover:bg-app-bg"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="jc-focus inline-flex items-center gap-1.5 rounded-xl bg-app-accent px-4 py-2.5 text-sm font-bold text-app-accent-fg transition-colors hover:bg-app-accent-strong disabled:opacity-60"
          >
            {saving ? <span className="jc-spinner" /> : <RefreshCw className="h-4 w-4" />}
            Simpan
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {err && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-app-danger/30 bg-app-danger-soft p-3 text-sm font-medium text-app-danger"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {err}
          </div>
        )}
        <CustomDropdown
          label="Gender"
          required
          value={gender}
          onChange={(value) => setGender(value as typeof gender)}
          options={GENDER_VALUES.map((g) => ({ value: g, label: GENDER_LABEL[g] }))}
        />
        <Field label="Nama Lengkap">
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="jc-input"
            maxLength={80}
          />
        </Field>
        <Field label="Nama Belakang">
          <input
            type="text"
            value={backName}
            onChange={(e) => setBackName(e.target.value)}
            className="jc-input"
            maxLength={20}
          />
        </Field>
        <Field label="Nomor Punggung">
          <input
            type="text"
            inputMode="numeric"
            value={backNumber}
            onChange={(e) => setBackNumber(e.target.value.replace(/[^\d]/g, ""))}
            className="jc-input"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <CustomDropdown
            label="Ukuran"
            required
            value={size}
            onChange={(value) => setSize(value as typeof size)}
            options={SIZE_VALUES.map((s) => ({ value: s, label: SIZE_LABEL[s] }))}
          />
          <CustomDropdown
            label="Lengan"
            required
            value={sleeve}
            onChange={(value) => setSleeve(value as typeof sleeve)}
            options={SLEEVE_VALUES.map((s) => ({ value: s, label: SLEEVE_LABEL[s] }))}
          />
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-app-fg">{label}</label>
      {children}
    </div>
  );
}
