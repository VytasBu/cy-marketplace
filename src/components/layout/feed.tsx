"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useListings } from "@/lib/hooks/use-listings";
import { useFilters } from "@/lib/hooks/use-filters";
import { ListingCard } from "@/components/listing/listing-card";
import { SearchInput } from "@/components/filters/search-input";
import { SaveSearchButton } from "@/components/filters/save-search-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import type { Category, Listing } from "@/types";

interface FeedProps {
  onSelectListing: (listing: Listing) => void;
  selectedId: string | null;
  onOpenFilters: () => void;
}

function useCategoryBreadcrumb(slug: string | undefined) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  if (!slug || categories.length === 0) return null;

  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const byId = new Map(categories.map((c) => [c.id, c]));
  const cat = bySlug.get(slug);
  if (!cat) return null;

  const parts: { name: string; icon: string | null }[] = [];
  let current: Category | undefined = cat;
  while (current) {
    parts.unshift({ name: current.name, icon: current.icon });
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return parts;
}

export function Feed({ onSelectListing, selectedId, onOpenFilters }: FeedProps) {
  const { listings, total, loading, hasMore, loadMore } = useListings();
  const { filters, setFilter } = useFilters();
  const observerRef = useRef<HTMLDivElement>(null);
  const categoryBreadcrumb = useCategoryBreadcrumb(filters.category);

  // Infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loading) {
        loadMore();
      }
    },
    [hasMore, loading, loadMore]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="flex flex-col h-full">
      {/* Search + mobile filter button */}
      <div className="sticky top-0 z-10 bg-background border-b p-3 flex gap-2">
        <SearchInput />
        <SaveSearchButton />
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={onOpenFilters}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Context header — search query or category breadcrumb */}
      {(filters.search || filters.category) && (
        <div className="px-3 pt-3 pb-1 flex items-start gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-7 w-7 mt-0.5"
            onClick={() => {
              if (filters.search) setFilter("search", undefined);
              if (filters.category) setFilter("category", undefined);
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            {filters.search && (
              <p className="font-semibold text-base leading-tight">
                Search results for &ldquo;{filters.search}&rdquo;
              </p>
            )}
            {filters.category && categoryBreadcrumb && (
              <p className="font-semibold text-base leading-tight">
                {categoryBreadcrumb.map((part, i) => (
                  <span key={i}>
                    {i > 0 && (
                      <span className="text-muted-foreground font-normal"> › </span>
                    )}
                    {part.icon && <span className="mr-1">{part.icon}</span>}
                    {part.name}
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="px-3 py-2 text-sm text-muted-foreground">
        {loading ? "Loading..." : `${total} listings found`}
      </div>

      {/* Listing cards — grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {loading && listings.length === 0 ? (
          // Loading skeletons
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-lg border overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="p-2.5 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No listings found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isSelected={selectedId === listing.id}
                  onClick={() => onSelectListing(listing)}
                />
              ))}
            </div>
            {/* Infinite scroll trigger */}
            <div ref={observerRef} className="h-4" />
            {loading && listings.length > 0 && (
              <div className="flex justify-center py-4">
                <Skeleton className="h-8 w-32" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
