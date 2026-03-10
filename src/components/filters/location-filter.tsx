"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useFilters } from "@/lib/hooks/use-filters";

const CYPRUS_CITIES = [
  "Limassol",
  "Nicosia",
  "Paphos",
  "Larnaca",
  "Ayia Napa",
  "Famagusta",
  "Protaras",
  "Kyrenia",
];

export function LocationFilter() {
  const { filters, setFilter } = useFilters();

  return (
    <div>
      <h3 className="font-medium text-sm mb-2">Location</h3>
      <div className="space-y-2">
        {CYPRUS_CITIES.map((city) => (
          <label
            key={city}
            className="flex items-center gap-2 text-sm cursor-pointer"
          >
            <Checkbox
              checked={filters.location === city}
              onCheckedChange={(checked) =>
                setFilter("location", checked ? city : undefined)
              }
            />
            {city}
          </label>
        ))}
      </div>
    </div>
  );
}
