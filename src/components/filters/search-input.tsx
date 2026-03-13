"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Search, X, Clock, FolderOpen } from "lucide-react";
import { useFilters } from "@/lib/hooks/use-filters";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import type { Category } from "@/types";

// --- localStorage helpers ---
const STORAGE_KEY = "cy-recent-searches";
const MAX_RECENT = 3;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(term: string): void {
  const trimmed = term.trim();
  if (!trimmed) return;
  const current = getRecentSearches().filter((s) => s !== trimmed);
  current.unshift(trimmed);
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(current.slice(0, MAX_RECENT))
  );
}

function removeRecentSearch(term: string): void {
  const current = getRecentSearches().filter((s) => s !== term);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

// --- Category suggestion helpers ---
interface CategorySuggestion {
  label: string;
  slug: string;
  icon: string | null;
}

function buildCategorySuggestions(
  categories: Category[],
  query: string
): CategorySuggestion[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const byId = new Map<number, Category>();
  for (const c of categories) byId.set(c.id, c);

  function getBreadcrumb(cat: Category): string {
    const parts: string[] = [];
    let current: Category | undefined = cat;
    while (current) {
      parts.unshift(current.name);
      current = current.parent_id ? byId.get(current.parent_id) : undefined;
    }
    return parts.join(" › ");
  }

  const matches: CategorySuggestion[] = [];
  for (const cat of categories) {
    const nameMatch = cat.name.toLowerCase().includes(q);
    const keywordMatch = cat.keywords?.some((kw) =>
      kw.toLowerCase().includes(q)
    );
    if (nameMatch || keywordMatch) {
      matches.push({
        label: getBreadcrumb(cat),
        slug: cat.slug,
        icon: cat.icon,
      });
    }
    if (matches.length >= 5) break;
  }
  return matches;
}

export function SearchInput() {
  const { filters, setFilter } = useFilters();
  const [inputValue, setInputValue] = useState(filters.search || "");
  const [open, setOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Fetch categories once
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  // Sync from URL changes (e.g. clearFilters)
  useEffect(() => {
    setInputValue(filters.search || "");
  }, [filters.search]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const executeSearch = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (trimmed) {
        addRecentSearch(trimmed);
        setRecentSearches(getRecentSearches());
      }
      setFilter("search", trimmed || undefined);
      setOpen(false);
    },
    [setFilter]
  );

  const selectCategory = useCallback(
    (slug: string) => {
      setFilter("category", slug);
      setFilter("search", undefined);
      setInputValue("");
      setOpen(false);
    },
    [setFilter]
  );

  const handleRemoveRecent = useCallback(
    (e: React.MouseEvent, term: string) => {
      e.stopPropagation();
      e.preventDefault();
      removeRecentSearch(term);
      setRecentSearches(getRecentSearches());
    },
    []
  );

  const categorySuggestions = buildCategorySuggestions(categories, inputValue);
  const showRecent = !inputValue.trim() && recentSearches.length > 0;
  const showSuggestions = inputValue.trim().length > 0;

  return (
    <div ref={containerRef} className="relative flex-1">
      <Command shouldFilter={false} className="bg-transparent overflow-visible">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
          <CommandInput
            placeholder="Search listings..."
            value={inputValue}
            onValueChange={(v) => {
              setInputValue(v);
              if (!open) setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                executeSearch(inputValue);
              }
              if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            className="pl-6"
          />
        </div>

        {open && (showRecent || showSuggestions) && (
          <CommandList className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-md max-h-64 overflow-y-auto">
            {showRecent && (
              <CommandGroup heading="Recent searches">
                {recentSearches.map((term) => (
                  <CommandItem
                    key={term}
                    value={`recent-${term}`}
                    onSelect={() => {
                      setInputValue(term);
                      executeSearch(term);
                    }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{term}</span>
                    </div>
                    <button
                      onClick={(e) => handleRemoveRecent(e, term)}
                      className="ml-2 p-0.5 rounded hover:bg-muted shrink-0"
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {showSuggestions && (
              <>
                <CommandGroup>
                  <CommandItem
                    value={`search-${inputValue}`}
                    onSelect={() => executeSearch(inputValue)}
                  >
                    <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>
                      Search for &ldquo;<span className="font-medium">{inputValue}</span>&rdquo;
                    </span>
                  </CommandItem>
                </CommandGroup>

                {categorySuggestions.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup heading="Categories">
                      {categorySuggestions.map((cat) => (
                        <CommandItem
                          key={cat.slug}
                          value={`cat-${cat.slug}`}
                          onSelect={() => selectCategory(cat.slug)}
                        >
                          {cat.icon ? (
                            <span className="shrink-0">{cat.icon}</span>
                          ) : (
                            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className="truncate">{cat.label}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </>
            )}
          </CommandList>
        )}
      </Command>
    </div>
  );
}
