"use client";

import { CategoryFilter } from "@/components/filters/category-filter";
import { PriceRangeFilter } from "@/components/filters/price-range-filter";
import { LocationFilter } from "@/components/filters/location-filter";
import { DateFilter } from "@/components/filters/date-filter";
import { SortSelect } from "@/components/filters/sort-select";
import { LanguageToggle } from "@/components/filters/language-toggle";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useFilters } from "@/lib/hooks/use-filters";

export function FiltersSidebar() {
  const { clearFilters } = useFilters();

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear all
        </Button>
      </div>

      <Separator />

      <SortSelect />

      <Separator />

      <CategoryFilter />

      <Separator />

      <PriceRangeFilter />

      <Separator />

      <LocationFilter />

      <Separator />

      <DateFilter />

      <Separator />

      <LanguageToggle />
    </div>
  );
}
