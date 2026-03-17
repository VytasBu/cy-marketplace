"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, LayoutGrid, Search } from "lucide-react";
import { useFilters } from "@/lib/hooks/use-filters";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

export function CategoryFilterPopover() {
  const { filters, setFilter } = useFilters();
  const [categories, setCategories] = useState<Category[]>([]);
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []));
  }, []);

  // Reset search when popover closes
  useEffect(() => {
    if (!open) setSearchQuery("");
  }, [open]);

  const roots = categories.filter((c) => c.parent_id === null);
  const byId = useMemo(() => {
    const map = new Map<number, Category>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  const getChildren = (parentId: number) =>
    categories.filter((c) => c.parent_id === parentId);

  const toggleOpen = (id: number) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelect = (slug: string) => {
    setFilter("category", filters.category === slug ? undefined : slug);
    setOpen(false);
  };

  // Build breadcrumb path for a category
  function getBreadcrumb(cat: Category): string {
    const parts: string[] = [];
    let current: Category | undefined = cat;
    while (current) {
      parts.unshift(current.name);
      current = current.parent_id ? byId.get(current.parent_id) : undefined;
    }
    return parts.join(" › ");
  }

  // Filter categories by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.keywords?.some((kw) => kw.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  // Resolve current category name for trigger label
  const selectedCategory = categories.find((c) => c.slug === filters.category);
  const isActive = !!filters.category;

  function renderCategory(cat: Category, depth = 0) {
    const children = getChildren(cat.id);
    const isSelected = filters.category === cat.slug;
    const hasChildren = children.length > 0;
    const isExpanded = openIds.has(cat.id);

    return (
      <div key={cat.id}>
        <Collapsible open={isExpanded} onOpenChange={() => toggleOpen(cat.id)}>
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
              onClick={() => handleSelect(cat.slug)}
              className="flex-1 text-left truncate"
            >
              {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
              {cat.name}
            </button>
          </div>
          {hasChildren && (
            <CollapsibleContent>
              {children.map((child) => renderCategory(child, depth + 1))}
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    );
  }

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
        <LayoutGrid className="h-3.5 w-3.5 opacity-60" />
        {selectedCategory
          ? `${selectedCategory.icon || ""} ${selectedCategory.name}`.trim()
          : "Category"}
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0">
        {/* Search input */}
        <div className="flex items-center gap-2 px-3 py-2 border-b">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="max-h-[280px] overflow-y-auto p-1">
          {filteredCategories ? (
            /* Search results — flat list with breadcrumbs */
            <>
              {filteredCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">
                  No categories found
                </p>
              ) : (
                filteredCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelect(cat.slug)}
                    className={cn(
                      "w-full text-left text-sm py-1.5 px-2 rounded-md hover:bg-accent flex items-center gap-1.5 truncate",
                      filters.category === cat.slug && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    {cat.icon && <span className="shrink-0">{cat.icon}</span>}
                    <span className="truncate">{getBreadcrumb(cat)}</span>
                  </button>
                ))
              )}
            </>
          ) : (
            /* Default tree view */
            <>
              <button
                onClick={() => {
                  setFilter("category", undefined);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left text-sm py-1.5 px-2 rounded-md hover:bg-accent",
                  !filters.category && "bg-primary/10 text-primary font-medium"
                )}
              >
                All categories
              </button>
              {roots.map((cat) => renderCategory(cat))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
