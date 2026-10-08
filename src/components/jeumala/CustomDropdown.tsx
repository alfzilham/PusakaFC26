"use client";

import {
  useId,
  useRef,
  useState,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type DropdownOption = {
  value: string;
  label: string;
};

type CustomDropdownProps = {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  required?: boolean;
  invalid?: boolean;
  errorText?: string;
  hint?: string;
  disabled?: boolean;
};

export function CustomDropdown({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Pilih…",
  required,
  invalid,
  errorText,
  hint,
  disabled,
}: CustomDropdownProps) {
  const autoId = useId();
  const listboxId = id || `dd-${autoId}`;
  const triggerId = `${listboxId}-trigger`;

  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const selectedOption = options.find((o) => o.value === value);

  const close = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
      setActiveIndex(-1);
    }, 120);
  }, []);

  const openMenu = useCallback(() => {
    setClosing(false);
    setOpen(true);
    const idx = options.findIndex((o) => o.value === value);
    setActiveIndex(idx >= 0 ? idx : 0);
  }, [options, value]);

  // Click outside / Esc to close
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    }
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  // Scroll active option into view
  useEffect(() => {
    if (open && activeIndex >= 0) {
      optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, open]);

  function handleTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) openMenu();
      else setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp" && open) {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
  }

  function handlePanelKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (activeIndex >= 0) {
        select(options[activeIndex]);
      }
    }
  }

  function select(opt: DropdownOption) {
    onChange(opt.value);
    close();
    triggerRef.current?.focus();
  }

  const describedBy =
    [hint ? `${listboxId}-hint` : null, invalid && errorText ? `${listboxId}-err` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="w-full">
      <label
        htmlFor={triggerId}
        className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-app-fg"
      >
        {label}
        {required && (
          <span className="text-app-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div className="relative">
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-describedby={describedBy}
          onClick={() => (open ? close() : openMenu())}
          onKeyDown={handleTriggerKeyDown}
          className={cn(
            "jc-focus flex w-full items-center justify-between gap-2 rounded-xl border bg-app-surface px-3.5 py-3 text-left text-sm font-medium transition-colors",
            "hover:border-app-border-strong",
            disabled && "cursor-not-allowed opacity-55",
            invalid
              ? "border-app-danger ring-1 ring-app-danger/30"
              : "border-app-border",
            open && "border-app-accent ring-1 ring-app-accent/30"
          )}
        >
          <span
            className={cn(
              "truncate",
              !selectedOption && "text-app-muted"
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-app-muted transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>

        {open && (
          <div
            ref={panelRef}
            role="listbox"
            id={listboxId}
            tabIndex={-1}
            aria-labelledby={triggerId}
            aria-activedescendant={
              activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
            }
            onKeyDown={handlePanelKeyDown}
            className={cn(
              "jc-dropdown-panel jc-scroll absolute z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-app-border bg-app-surface p-1.5 shadow-lg",
              closing && "closing"
            )}
          >
            {options.map((opt, i) => {
              const isActive = i === activeIndex;
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  ref={(el) => {
                    optionRefs.current[i] = el;
                  }}
                  id={`${listboxId}-opt-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={-1}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(opt);
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    "jc-focus flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors",
                    isActive
                      ? "bg-app-accent/10 text-app-accent-strong"
                      : "text-app-fg"
                  )}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <Check className="h-4 w-4 text-app-accent" strokeWidth={2.5} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {hint && !invalid && (
        <p id={`${listboxId}-hint`} className="mt-1.5 text-xs text-app-muted">
          {hint}
        </p>
      )}
      {invalid && errorText && (
        <p
          id={`${listboxId}-err`}
          role="alert"
          aria-live="polite"
          className="mt-1.5 text-xs font-medium text-app-danger"
        >
          {errorText}
        </p>
      )}
    </div>
  );
}
