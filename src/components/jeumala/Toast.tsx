"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
  leaving?: boolean;
};

type ToastContextValue = {
  show: (t: {
    variant?: ToastVariant;
    title: string;
    description?: string;
    duration?: number;
  }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const remove = useCallback((id: number) => {
    // mark leaving for exit animation
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timers.current[id];
    }, 280);
  }, []);

  const show = useCallback<ToastContextValue["show"]>(
    ({ variant = "info", title, description, duration = 3000 }) => {
      const id = ++counter;
      setToasts((prev) => [...prev, { id, variant, title, description }]);
      timers.current[id] = setTimeout(() => remove(id), duration);
    },
    [remove]
  );

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex flex-col items-center gap-2 px-4 pt-4 sm:pt-6"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  onClose,
}: {
  toast: ToastItem;
  onClose: () => void;
}) {
  const iconMap = {
    success: <CheckCircle2 className="h-5 w-5 text-app-success" />,
    error: <XCircle className="h-5 w-5 text-app-danger" />,
    info: <Info className="h-5 w-5 text-app-accent" />,
  };
  const barMap = {
    success: "bg-app-success",
    error: "bg-app-danger",
    info: "bg-app-accent",
  };
  return (
    <div
      role="status"
      className={cn(
        "jc-toast pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-lg",
        toast.leaving && "leaving"
      )}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", barMap[toast.variant])} />
      <div className="flex items-start gap-3 p-4 pl-5">
        <span className="mt-0.5 shrink-0">{iconMap[toast.variant]}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-app-fg">{toast.title}</p>
          {toast.description && (
            <p className="mt-0.5 text-xs text-app-muted">{toast.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup notifikasi"
          className="jc-focus -mr-1 -mt-1 rounded-md p-1 text-app-muted transition-colors hover:bg-app-bg hover:text-app-fg"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
