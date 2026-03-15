"use client";

import { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ChevronDown, Check } from "lucide-react";
import { useFilters } from "@/lib/hooks/use-filters";
import { cn } from "@/lib/utils";

const DATE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
] as const;

export function DateFilterPopover() {
  const { filters, setFilter } = useFilters();
  const [open, setOpen] = useState(false);

  const current = filters.datePosted || "all";
  const isActive = !!filters.datePosted && filters.datePosted !== "all";
  const currentLabel =
    DATE_OPTIONS.find((o) => o.value === current)?.label || "Date";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors hover:bg-accent cursor-pointer",
          isActive
            ? "border-primary text-primary"
            : "border-border text-foreground"
        )}
      >
        {isActive ? currentLabel : "Date"}
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </PopoverTrigger>
      <PopoverContent className="w-[160px] p-1">
        {DATE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => {
              setFilter("datePosted", value === "all" ? undefined : value);
              setOpen(false);
            }}
            className={cn(
              "w-full text-left text-sm py-1.5 px-2 rounded-md hover:bg-accent flex items-center justify-between",
              current === value && "bg-primary/10 text-primary font-medium"
            )}
          >
            {label}
            {current === value && <Check className="h-3.5 w-3.5" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
