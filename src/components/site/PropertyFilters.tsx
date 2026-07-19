"use client";

import { propertyFilters, type PropertyFilter } from "@/lib/properties";
import { cn } from "@/lib/cn";

/** Minimal editorial text tabs with a fine underline indicator. */
export function PropertyFilters({
  active,
  onChange,
}: {
  active: PropertyFilter;
  onChange: (f: PropertyFilter) => void;
}) {
  return (
    <div
      className="no-scrollbar -mx-5 flex gap-6 overflow-x-auto px-5 sm:mx-0 sm:px-0"
      role="tablist"
      aria-label="Filter properties"
    >
      {propertyFilters.map((f) => {
        const selected = f === active;
        return (
          <button
            key={f}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(f)}
            className={cn(
              "focus-lime relative shrink-0 pb-2 text-[0.9rem] font-medium transition-colors",
              selected ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            {f}
            <span
              className={cn(
                "absolute inset-x-0 bottom-0 h-px origin-left transition-transform duration-300",
                selected ? "scale-x-100 bg-ink" : "scale-x-0 bg-ink",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
