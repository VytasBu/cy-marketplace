"use client";

import { useFilters } from "@/lib/hooks/use-filters";
import { cn } from "@/lib/utils";

const DATE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
] as const;

export function DateFilter() {
  const { filters, setFilter } = useFilters();
  const current = filters.datePosted || "all";

  return (
    <div>
      <h3 className="font-medium text-sm mb-2">Date posted</h3>
      <div className="space-y-1">
        {DATE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter("datePosted", value)}
            className={cn(
              "w-full text-left text-sm py-1.5 px-2 rounded-md hover:bg-accent",
              current === value && "bg-primary/10 text-primary font-medium"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
