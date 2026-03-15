"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useFilters } from "@/lib/hooks/use-filters";
import type { Category } from "@/types";

const DATE_LABELS: Record<string, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
};

function Chip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-sm">
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5 cursor-pointer"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export function ActiveFilterChips() {
  const { filters, setFilter } = useFilters();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (filters.category) {
      fetch("/api/categories")
        .then((res) => res.json())
        .then((data) => setCategories(data.categories || []))
        .catch(() => {});
    }
  }, [filters.category]);

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  // Search chip
  if (filters.search) {
    chips.push({
      key: "search",
      label: filters.search,
      onRemove: () => setFilter("search", undefined),
    });
  }

  // Category chip
  if (filters.category) {
    const cat = categories.find((c) => c.slug === filters.category);
    const name = cat
      ? `${cat.icon || ""} ${cat.name}`.trim()
      : filters.category;
    chips.push({
      key: "category",
      label: name,
      onRemove: () => setFilter("category", undefined),
    });
  }

  // Price chips
  if (filters.priceMin) {
    chips.push({
      key: "priceMin",
      label: `From €${filters.priceMin}`,
      onRemove: () => setFilter("priceMin", undefined),
    });
  }
  if (filters.priceMax) {
    chips.push({
      key: "priceMax",
      label: `To €${filters.priceMax}`,
      onRemove: () => setFilter("priceMax", undefined),
    });
  }

  // Location chip
  if (filters.location) {
    chips.push({
      key: "location",
      label: filters.location,
      onRemove: () => setFilter("location", undefined),
    });
  }

  // Date chip
  if (filters.datePosted && filters.datePosted !== "all") {
    chips.push({
      key: "datePosted",
      label: DATE_LABELS[filters.datePosted] || filters.datePosted,
      onRemove: () => setFilter("datePosted", undefined),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <Chip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
      ))}
    </div>
  );
}
