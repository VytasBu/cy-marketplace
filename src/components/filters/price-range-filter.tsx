"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useFilters } from "@/lib/hooks/use-filters";

export function PriceRangeFilter() {
  const { filters, setFilter } = useFilters();
  const [min, setMin] = useState(filters.priceMin?.toString() || "");
  const [max, setMax] = useState(filters.priceMax?.toString() || "");

  // Debounce
  useEffect(() => {
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
          onChange={(e) => setMin(e.target.value)}
          className="h-8 text-sm"
        />
        <span className="text-muted-foreground text-sm">-</span>
        <Input
          type="number"
          placeholder="Max"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}
