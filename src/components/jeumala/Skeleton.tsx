"use client";

import { cn } from "@/lib/utils";

export function FormSkeleton() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-6 space-y-2">
        <div className="jc-shimmer h-7 w-56 rounded-lg" />
        <div className="jc-shimmer h-4 w-72 rounded-md" />
      </div>
      <div className="space-y-5 rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-2">
            <div className="jc-shimmer h-4 w-28 rounded-md" />
            <div
              className={cn(
                "jc-shimmer h-12 w-full rounded-xl",
                i === 4 && "max-w-[180px]"
              )}
            />
          </div>
        ))}
        <div className="jc-shimmer h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function NumbersSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 space-y-2">
        <div className="jc-shimmer h-7 w-64 rounded-lg" />
        <div className="jc-shimmer h-4 w-80 rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="jc-shimmer h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
