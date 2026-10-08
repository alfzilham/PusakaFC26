"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type CustomCheckboxProps = {
  label: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function CustomCheckbox({
  label,
  checked,
  onChange,
  disabled,
  className,
}: CustomCheckboxProps) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        "group inline-flex cursor-pointer items-center gap-2.5 select-none",
        disabled && "cursor-not-allowed opacity-55",
        className
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        role="presentation"
        className={cn(
          "jc-checkbox jc-focus jc-checkbox-box relative flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
          checked
            ? "border-app-accent bg-app-accent"
            : "border-app-border-strong bg-app-surface group-hover:border-app-accent",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-app-accent"
        )}
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <path
            className="jc-check-tick"
            d="M3 8.5 6.5 12 13 4.5"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-sm font-medium text-app-fg">{label}</span>
    </label>
  );
}
