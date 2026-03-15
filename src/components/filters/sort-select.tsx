"use client";

import { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ArrowUpDown, ChevronDown, Check } from "lucide-react";
import { useFilters } from "@/lib/hooks/use-filters";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export function SortSelect() {
  const { filters, setFilter } = useFilters();
  const [open, setOpen] = useState(false);

  const current = filters.sort || "newest";
  const currentLabel = SORT_OPTIONS.find((o) => o.value === current)?.label || "Newest first";
  const isActive = !!filters.sort && filters.sort !== "newest";

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
        <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
        {currentLabel}
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-1">
        {SORT_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => {
              setFilter("sort", value === "newest" ? undefined : value);
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
