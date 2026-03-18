"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Check,
  LayoutGrid,
  Search,
} from "lucide-react";
import { useFilters } from "@/lib/hooks/use-filters";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

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

const DATE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
] as const;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export function MobileFiltersSheet() {
  const { filters, setFilter, setFilters, clearFilters } = useFilters();
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());
  const [catSearch, setCatSearch] = useState("");
  const [priceMin, setPriceMin] = useState(filters.priceMin?.toString() || "");
  const [priceMax, setPriceMax] = useState(filters.priceMax?.toString() || "");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["category"]));

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  // Sync price from URL
  useEffect(() => {
    setPriceMin(filters.priceMin?.toString() || "");
    setPriceMax(filters.priceMax?.toString() || "");
  }, [filters.priceMin, filters.priceMax]);

  const roots = categories.filter((c) => c.parent_id === null);
  const byId = useMemo(() => {
    const map = new Map<number, Category>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);
  const getChildren = (parentId: number) =>
    categories.filter((c) => c.parent_id === parentId);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const filteredCategories = useMemo(() => {
    if (!catSearch.trim()) return null;
    const q = catSearch.toLowerCase();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.keywords?.some((kw) => kw.toLowerCase().includes(q))
    );
  }, [categories, catSearch]);

  function getBreadcrumb(cat: Category): string {
    const parts: string[] = [];
    let current: Category | undefined = cat;
    while (current) {
      parts.unshift(current.name);
      current = current.parent_id ? byId.get(current.parent_id) : undefined;
    }
    return parts.join(" › ");
  }

  const handleApply = () => {
    const updates: Record<string, string | number | undefined> = {};
    const minVal = priceMin ? Number(priceMin) : undefined;
    const maxVal = priceMax ? Number(priceMax) : undefined;
    if (minVal !== filters.priceMin) updates.priceMin = minVal;
    if (maxVal !== filters.priceMax) updates.priceMax = maxVal;
    if (Object.keys(updates).length > 0) setFilters(updates);
    setOpen(false);
  };

  const activeFilterCount = [
    filters.category,
    filters.priceMin,
    filters.priceMax,
    filters.location,
    filters.datePosted && filters.datePosted !== "all" ? filters.datePosted : undefined,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  const selectedCategory = categories.find((c) => c.slug === filters.category);

  function renderCategoryTree(cat: Category, depth = 0) {
    const children = getChildren(cat.id);
    const isSelected = filters.category === cat.slug;
    const hasChildren = children.length > 0;
    const isExpanded = openIds.has(cat.id);

    return (
      <div key={cat.id}>
        <Collapsible
          open={isExpanded}
          onOpenChange={() => {
            setOpenIds((prev) => {
              const next = new Set(prev);
              if (next.has(cat.id)) next.delete(cat.id);
              else next.add(cat.id);
              return next;
            });
          }}
        >
          <div
            className={cn(
              "flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer text-sm hover:bg-accent",
              isSelected && "bg-primary/10 text-primary font-medium"
            )}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            {hasChildren && (
              <CollapsibleTrigger className="p-0.5">
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    isExpanded && "rotate-90"
                  )}
                />
              </CollapsibleTrigger>
            )}
            {!hasChildren && <span className="w-4.5" />}
            <button
              onClick={() => setFilter("category", filters.category === cat.slug ? undefined : cat.slug)}
              className="flex-1 text-left truncate"
            >
              {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
              {cat.name}
            </button>
          </div>
          {hasChildren && (
            <CollapsibleContent>
              {children.map((child) => renderCategoryTree(child, depth + 1))}
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-1 h-8 text-sm font-medium whitespace-nowrap transition-colors hover:bg-accent cursor-pointer flex-1",
          hasActiveFilters
            ? "border-primary text-primary"
            : "border-border text-foreground"
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5 opacity-60" />
        Filters
        {hasActiveFilters && (
          <span className="bg-primary/15 text-primary text-xs rounded-md px-1.5 py-0.5 font-medium">
            {activeFilterCount}
          </span>
        )}
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="flex items-center justify-between">
            <DrawerTitle>Filters</DrawerTitle>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  clearFilters();
                  setPriceMin("");
                  setPriceMax("");
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Clear all
              </button>
            )}
          </DrawerHeader>

          <div className="overflow-y-auto px-4 pb-4 space-y-4">
            {/* Category section */}
            <div className="border rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection("category")}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
              >
                <span className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 opacity-60" />
                  Category
                  {selectedCategory && (
                    <span className="text-primary text-xs">
                      {selectedCategory.icon} {selectedCategory.name}
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    expandedSections.has("category") && "rotate-180"
                  )}
                />
              </button>
              {expandedSections.has("category") && (
                <div className="px-3 pb-3 space-y-2">
                  <div className="flex items-center gap-2 px-2 py-1.5 border rounded-lg">
                    <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      placeholder="Search categories..."
                      value={catSearch}
                      onChange={(e) => setCatSearch(e.target.value)}
                      className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {filteredCategories ? (
                      filteredCategories.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          No categories found
                        </p>
                      ) : (
                        filteredCategories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() =>
                              setFilter(
                                "category",
                                filters.category === cat.slug ? undefined : cat.slug
                              )
                            }
                            className={cn(
                              "w-full text-left text-sm py-1.5 px-2 rounded-md hover:bg-accent flex items-center gap-1.5",
                              filters.category === cat.slug &&
                                "bg-primary/10 text-primary font-medium"
                            )}
                          >
                            {cat.icon && <span className="shrink-0">{cat.icon}</span>}
                            <span className="truncate">{getBreadcrumb(cat)}</span>
                          </button>
                        ))
                      )
                    ) : (
                      <>
                        <button
                          onClick={() => setFilter("category", undefined)}
                          className={cn(
                            "w-full text-left text-sm py-1.5 px-2 rounded-md hover:bg-accent",
                            !filters.category && "bg-primary/10 text-primary font-medium"
                          )}
                        >
                          All categories
                        </button>
                        {roots.map((cat) => renderCategoryTree(cat))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Price section */}
            <div className="border rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection("price")}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
              >
                <span>Price range</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    expandedSections.has("price") && "rotate-180"
                  )}
                />
              </button>
              {expandedSections.has("price") && (
                <div className="px-4 pb-3">
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      placeholder="From"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      className="h-9 text-sm"
                    />
                    <span className="text-muted-foreground text-sm">–</span>
                    <Input
                      type="number"
                      placeholder="To"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Location section */}
            <div className="border rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection("location")}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
              >
                <span>
                  Location
                  {filters.location && (
                    <span className="text-primary text-xs ml-2">{filters.location}</span>
                  )}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    expandedSections.has("location") && "rotate-180"
                  )}
                />
              </button>
              {expandedSections.has("location") && (
                <div className="px-3 pb-3">
                  <button
                    onClick={() => setFilter("location", undefined)}
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
                      onClick={() =>
                        setFilter("location", filters.location === city ? undefined : city)
                      }
                      className={cn(
                        "w-full text-left text-sm py-1.5 px-2 rounded-md hover:bg-accent flex items-center justify-between",
                        filters.location === city && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      {city}
                      {filters.location === city && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date section */}
            <div className="border rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection("date")}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
              >
                <span>
                  Date posted
                  {filters.datePosted && filters.datePosted !== "all" && (
                    <span className="text-primary text-xs ml-2">
                      {DATE_OPTIONS.find((o) => o.value === filters.datePosted)?.label}
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    expandedSections.has("date") && "rotate-180"
                  )}
                />
              </button>
              {expandedSections.has("date") && (
                <div className="px-3 pb-3">
                  {DATE_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() =>
                        setFilter("datePosted", value === "all" ? undefined : value)
                      }
                      className={cn(
                        "w-full text-left text-sm py-1.5 px-2 rounded-md hover:bg-accent flex items-center justify-between",
                        (filters.datePosted || "all") === value &&
                          "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      {label}
                      {(filters.datePosted || "all") === value && (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort section */}
            <div className="border rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection("sort")}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
              >
                <span>
                  Sort
                  {filters.sort && filters.sort !== "newest" && (
                    <span className="text-primary text-xs ml-2">
                      {SORT_OPTIONS.find((o) => o.value === filters.sort)?.label}
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    expandedSections.has("sort") && "rotate-180"
                  )}
                />
              </button>
              {expandedSections.has("sort") && (
                <div className="px-3 pb-3">
                  {SORT_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() =>
                        setFilter("sort", value === "newest" ? undefined : value)
                      }
                      className={cn(
                        "w-full text-left text-sm py-1.5 px-2 rounded-md hover:bg-accent flex items-center justify-between",
                        (filters.sort || "newest") === value &&
                          "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      {label}
                      {(filters.sort || "newest") === value && (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DrawerFooter>
            <Button onClick={handleApply} className="w-full">
              Show results
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
