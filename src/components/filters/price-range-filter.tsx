"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useFilters } from "@/lib/hooks/use-filters";

export function PriceRangeFilter() {
  const { filters, setFilter } = useFilters();
  const [min, setMin] = useState(filters.priceMin?.toString() || "");
  const [max, setMax] = useState(filters.priceMax?.toString() || "");
  const isUserInput = useRef(false);

  // Sync: URL → local state (external changes like clearFilters)
  useEffect(() => {
    isUserInput.current = false;
    setMin(filters.priceMin?.toString() || "");
    setMax(filters.priceMax?.toString() || "");
  }, [filters.priceMin, filters.priceMax]);

  // Debounce: local state → URL (only for user input, not programmatic syncs)
  useEffect(() => {
    if (!isUserInput.current) return;
    const timeout = setTimeout(() => {
      const minVal = min ? Number(min) : undefined;
      const maxVal = max ? Number(max) : undefined;
      if (minVal !== filters.priceMin) setFilter("priceMin", minVal);
      if (maxVal !== filters.priceMax) setFilter("priceMax", maxVal);
    }, 600);
    return () => clearTimeout(timeout);
  }, [min, max, filters.priceMin, filters.priceMax, setFilter]);

  return (
    <div>
      <h3 className="font-medium text-sm mb-2">Price range</h3>
      <div className="flex gap-2 items-center">
        <Input
          type="number"
          placeholder="Min"
          value={min}
          onChange={(e) => {
            isUserInput.current = true;
            setMin(e.target.value);
          }}
          className="h-8 text-sm"
        />
        <span className="text-muted-foreground text-sm">-</span>
        <Input
          type="number"
          placeholder="Max"
          value={max}
          onChange={(e) => {
            isUserInput.current = true;
            setMax(e.target.value);
          }}
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}
