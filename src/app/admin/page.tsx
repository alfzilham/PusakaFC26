"use client";

import { useEffect, useState } from "react";
import { AdminLogin } from "@/components/jeumala/admin/AdminLogin";
import { AdminDashboard } from "@/components/jeumala/admin/AdminDashboard";
import { ToastProvider } from "@/components/jeumala/Toast";
import { UpdateNotification } from "@/components/jeumala/UpdateNotification";

export default function AdminPage() {
  return (
    <ToastProvider>
      <UpdateNotification audience="admin" />
      <AdminGate />
    </ToastProvider>
  );
}

function AdminGate() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAuthed(!!d.authenticated))
      .catch(() => setAuthed(false))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="jc-spinner" style={{ color: "var(--jc-accent)" }} />
      </div>
    );
  }

  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} onBack={() => { window.location.href = "/"; }} />;
  }

  return <AdminDashboard onLogout={() => setAuthed(false)} />;
}
