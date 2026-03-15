"use client";

import { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ChevronDown, Check, MapPin } from "lucide-react";
import { useFilters } from "@/lib/hooks/use-filters";
import { cn } from "@/lib/utils";

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

export function LocationFilterPopover() {
  const { filters, setFilter } = useFilters();
  const [open, setOpen] = useState(false);

  const isActive = !!filters.location;

  const handleSelect = (city: string) => {
    setFilter("location", filters.location === city ? undefined : city);
    setOpen(false);
  };

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
        <MapPin className="h-3.5 w-3.5 opacity-60" />
        {filters.location || "Location"}
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-1">
        <button
          onClick={() => {
            setFilter("location", undefined);
            setOpen(false);
          }}
          className={cn(
            "w-full text-left text-sm py-1.5 px-2 rounded-md hover:bg-accent flex items-center justify-between",
            !filters.location && "bg-primary/10 text-primary font-medium"
          )}
        >
          All locations
          {!filters.location && <Check className="h-3.5 w-3.5" />}
        </button>
        {CYPRUS_CITIES.map((city) => (
          <button
            key={city}
            onClick={() => handleSelect(city)}
            className={cn(
              "w-full text-left text-sm py-1.5 px-2 rounded-md hover:bg-accent flex items-center justify-between",
              filters.location === city &&
                "bg-primary/10 text-primary font-medium"
            )}
          >
            {city}
            {filters.location === city && <Check className="h-3.5 w-3.5" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
