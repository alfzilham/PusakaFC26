"use client";

import { Menu } from "lucide-react";
import { Logo } from "./Logo";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function TopBar({ onMenu }: { onMenu: () => void }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-app-border bg-app-surface/85 backdrop-blur-md"
      )}
    >
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Logo size={34} />
          <span className="text-base font-extrabold tracking-tight text-app-fg sm:text-lg">
            {APP_NAME}
          </span>
        </div>
        <button
          type="button"
          onClick={onMenu}
          aria-label="Buka menu navigasi"
          className="jc-focus inline-flex h-10 w-10 items-center justify-center rounded-xl border border-app-border bg-app-surface text-app-fg transition-colors hover:border-app-border-strong hover:bg-app-bg"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
