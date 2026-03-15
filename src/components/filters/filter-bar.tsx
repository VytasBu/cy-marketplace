"use client";

import { useFilters } from "@/lib/hooks/use-filters";
import { CategoryFilterPopover } from "./category-filter-popover";
import { PriceFilterPopover } from "./price-filter-popover";
import { LocationFilterPopover } from "./location-filter-popover";
import { DateFilterPopover } from "./date-filter-popover";
import { SortSelect } from "./sort-select";
import { ActiveFilterChips } from "./active-filter-chips";

export function FilterBar() {
  const { filters, clearFilters } = useFilters();

  const hasActiveFilters = !!(
    filters.category ||
    filters.priceMin ||
    filters.priceMax ||
    filters.location ||
    (filters.datePosted && filters.datePosted !== "all")
  );

  return (
    <div className="space-y-2 px-3 py-2 border-b">
      {/* Filter trigger buttons */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        <CategoryFilterPopover />
        <PriceFilterPopover />
        <LocationFilterPopover />
        <DateFilterPopover />
        <SortSelect />
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-muted-foreground hover:text-foreground whitespace-nowrap ml-auto cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Active filter chips */}
      <ActiveFilterChips />
    </div>
  );
}
