"use client";

import { useEffect, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { useFilters } from "@/lib/hooks/use-filters";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

export function CategoryFilter() {
  const { filters, setFilter } = useFilters();
  const [categories, setCategories] = useState<Category[]>([]);
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []));
  }, []);

  const roots = categories.filter((c) => c.parent_id === null);

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
  };

  function renderCategory(cat: Category, depth = 0) {
    const children = getChildren(cat.id);
    const isSelected = filters.category === cat.slug;
    const hasChildren = children.length > 0;
    const isOpen = openIds.has(cat.id);

    return (
      <div key={cat.id}>
        <Collapsible open={isOpen} onOpenChange={() => toggleOpen(cat.id)}>
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
                    isOpen && "rotate-90"
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
    <div>
      <h3 className="font-medium text-sm mb-2">Category</h3>
      <button
        onClick={() => setFilter("category", undefined)}
        className={cn(
          "w-full text-left text-sm py-1.5 px-2 rounded-md hover:bg-accent",
          !filters.category && "bg-primary/10 text-primary font-medium"
        )}
      >
        All categories
      </button>
      {roots.map((cat) => renderCategory(cat))}
    </div>
  );
}
