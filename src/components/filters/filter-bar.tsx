"use client";

import { useFilters } from "@/lib/hooks/use-filters";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { CategoryFilterPopover } from "./category-filter-popover";
import { PriceFilterPopover } from "./price-filter-popover";
import { LocationFilterPopover } from "./location-filter-popover";
import { DateFilterPopover } from "./date-filter-popover";
import { SortSelect } from "./sort-select";

export function FilterBar() {
  const { filters, clearFilters } = useFilters();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const hasActiveFilters = !!(
    filters.category ||
    filters.priceMin ||
    filters.priceMax ||
    filters.location ||
    (filters.datePosted && filters.datePosted !== "all")
  );

  if (!isDesktop) return null;

  return (
    <div className="space-y-2 px-6 pt-6 pb-3">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        <CategoryFilterPopover />
        <PriceFilterPopover />
        <LocationFilterPopover />
        <DateFilterPopover />
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <SortSelect />
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-muted-foreground hover:text-foreground whitespace-nowrap cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
