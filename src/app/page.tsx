"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Splash } from "@/components/jeumala/Splash";
import { TopBar } from "@/components/jeumala/TopBar";
import { Sidebar, type ViewKey, type InfoKey } from "@/components/jeumala/Sidebar";
import { RegistrationForm } from "@/components/jeumala/RegistrationForm";
import { UsedNumbersList } from "@/components/jeumala/UsedNumbersList";
import { FormSkeleton, NumbersSkeleton } from "@/components/jeumala/Skeleton";
import { InformationPanel } from "@/components/jeumala/InformationPanel";
import { ToastProvider } from "@/components/jeumala/Toast";
import { UpdateNotification } from "@/components/jeumala/UpdateNotification";
import type { UsedEntry } from "@/lib/validations";

export default function Page() {
  return (
    <ToastProvider>
      <AppShell />
    </ToastProvider>
  );
}

function AppShell() {
  const [splashDone, setSplashDone] = useState(false);
  const [data, setData] = useState<UsedEntry[] | null>(null);
  const [view, setView] = useState<ViewKey>("form");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [info, setInfo] = useState<InfoKey | null>(null);
  const fetchedRef = useRef(false);

  // Fetch used entries once, with a minimum 400ms display window.
  // This is also reused to refetch the cache after a successful submit.
  const fetchUsed = useCallback(async () => {
    try {
      const [res] = await Promise.all([
        fetch("/api/orders", { cache: "no-store" }),
        new Promise((r) => setTimeout(r, 400)),
      ]);
      if (!res.ok) {
        setData([]);
        return;
      }
      const json = await res.json();
      setData(json.data as UsedEntry[]);
    } catch {
      setData([]);
    }
  }, []);

  // Kick off the initial data load on mount (legitimate external sync).
  // The fetch + setState happen inside an async callback (after await), so
  // they are not synchronous state updates within the effect body.
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    let active = true;
    void (async () => {
      await fetchUsed();
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [fetchUsed]);

  // ---- Splash phase ----
  if (!splashDone) {
    return <Splash onDone={() => setSplashDone(true)} />;
  }

  // ---- Skeleton phase (min 400ms shimmer while data loads) ----
  if (!data) {
    return (
      <div className="min-h-screen">
        <TopBar onMenu={() => setSidebarOpen(true)} />
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
          {view === "form" ? <FormSkeleton /> : <NumbersSkeleton />}
        </main>
      </div>
    );
  }

  // ---- App ready ----
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar onMenu={() => setSidebarOpen(true)} />
      <UpdateNotification />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        current={view}
        onNavigate={setView}
        onOpenInfo={setInfo}
      />

      <main className="mx-auto w-full flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div key={view} className="jc-fade-in">
          {view === "form" ? (
            <RegistrationForm used={data} onAfterSubmit={fetchUsed} />
          ) : (
            <UsedNumbersList used={data} />
          )}
        </div>
      </main>

      <footer className="mt-auto border-t border-app-border bg-app-surface">
        <div className="mx-auto max-w-3xl px-4 py-5 text-center sm:px-6">
          <p className="text-xs text-app-muted">
            JeumalaCup 26 · Pendaftaran Jersey
          </p>
        </div>
      </footer>

      <InformationPanel info={info} onClose={() => setInfo(null)} />
    </div>
  );
}
