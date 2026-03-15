"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";
import { useFilters } from "@/lib/hooks/use-filters";
import { cn } from "@/lib/utils";

export function PriceFilterPopover() {
  const { filters, setFilter, setFilters } = useFilters();
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(filters.priceMin?.toString() || "");
  const [max, setMax] = useState(filters.priceMax?.toString() || "");
  const isUserInput = useRef(false);

  // Sync: URL → local state
  useEffect(() => {
    isUserInput.current = false;
    setMin(filters.priceMin?.toString() || "");
    setMax(filters.priceMax?.toString() || "");
  }, [filters.priceMin, filters.priceMax]);

  // Debounce: local state → URL
  useEffect(() => {
    if (!isUserInput.current) return;
    const timeout = setTimeout(() => {
      const minVal = min ? Number(min) : undefined;
      const maxVal = max ? Number(max) : undefined;
      const updates: Record<string, string | number | undefined> = {};
      if (minVal !== filters.priceMin) updates.priceMin = minVal;
      if (maxVal !== filters.priceMax) updates.priceMax = maxVal;
      if (Object.keys(updates).length > 0) setFilters(updates);
    }, 600);
    return () => clearTimeout(timeout);
  }, [min, max, filters.priceMin, filters.priceMax, setFilters]);

  // Flush on close
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && isUserInput.current) {
        const minVal = min ? Number(min) : undefined;
        const maxVal = max ? Number(max) : undefined;
        const updates: Record<string, string | number | undefined> = {};
        if (minVal !== filters.priceMin) updates.priceMin = minVal;
        if (maxVal !== filters.priceMax) updates.priceMax = maxVal;
        if (Object.keys(updates).length > 0) setFilters(updates);
        isUserInput.current = false;
      }
      setOpen(nextOpen);
    },
    [min, max, filters.priceMin, filters.priceMax, setFilters]
  );

  const isActive = !!(filters.priceMin || filters.priceMax);

  let triggerLabel = "Price";
  if (filters.priceMin && filters.priceMax) {
    triggerLabel = `€${filters.priceMin} – €${filters.priceMax}`;
  } else if (filters.priceMin) {
    triggerLabel = `From €${filters.priceMin}`;
  } else if (filters.priceMax) {
    triggerLabel = `To €${filters.priceMax}`;
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors hover:bg-accent cursor-pointer",
          isActive
            ? "border-primary text-primary"
            : "border-border text-foreground"
        )}
      >
        {triggerLabel}
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </PopoverTrigger>
      <PopoverContent className="w-[240px]">
        <div className="space-y-2">
          <p className="text-sm font-medium">Price range</p>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="From"
              value={min}
              onChange={(e) => {
                isUserInput.current = true;
                setMin(e.target.value);
              }}
              className="h-8 text-sm"
            />
            <span className="text-muted-foreground text-sm">–</span>
            <Input
              type="number"
              placeholder="To"
              value={max}
              onChange={(e) => {
                isUserInput.current = true;
                setMax(e.target.value);
              }}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
