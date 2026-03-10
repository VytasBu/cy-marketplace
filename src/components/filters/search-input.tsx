"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useFilters } from "@/lib/hooks/use-filters";

export function SearchInput() {
  const { filters, setFilter } = useFilters();
  const [value, setValue] = useState(filters.search || "");

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (value !== (filters.search || "")) {
        setFilter("search", value || undefined);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [value, filters.search, setFilter]);

  // Sync from URL
  useEffect(() => {
    setValue(filters.search || "");
  }, [filters.search]);

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search listings..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}
