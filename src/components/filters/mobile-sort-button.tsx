"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ArrowDownWideNarrow, Check } from "lucide-react";
import { useFilters } from "@/lib/hooks/use-filters";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export function MobileSortButton() {
  const { filters, setFilter } = useFilters();
  const [open, setOpen] = useState(false);

  const current = filters.sort || "newest";
  const currentLabel = SORT_OPTIONS.find((o) => o.value === current)?.label || "Newest First";
  const isActive = !!filters.sort && filters.sort !== "newest";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center justify-center gap-1 rounded-lg border-[0.5px] border-input bg-background shadow-xs px-3 py-1 h-8 text-sm font-medium whitespace-nowrap transition-colors hover:bg-muted cursor-pointer flex-1",
          isActive
            ? "border-primary text-primary"
            : "text-foreground"
        )}
      >
        <ArrowDownWideNarrow className="h-3.5 w-3.5 opacity-60" />
        {currentLabel}
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Sort by</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-1">
            {SORT_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => {
                  setFilter("sort", value === "newest" ? undefined : value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left text-sm py-2.5 px-3 rounded-lg hover:bg-accent flex items-center justify-between",
                  current === value && "bg-primary/10 text-primary font-medium"
                )}
              >
                {label}
                {current === value && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
