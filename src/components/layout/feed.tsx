"use client";

import { useEffect, useRef, useCallback } from "react";
import { useListings } from "@/lib/hooks/use-listings";
import { ListingCard } from "@/components/listing/listing-card";
import { SearchInput } from "@/components/filters/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import type { Listing } from "@/types";

interface FeedProps {
  onSelectListing: (listing: Listing) => void;
  selectedId: string | null;
  onOpenFilters: () => void;
}

export function Feed({ onSelectListing, selectedId, onOpenFilters }: FeedProps) {
  const { listings, total, loading, hasMore, loadMore } = useListings();
  const observerRef = useRef<HTMLDivElement>(null);

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
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={onOpenFilters}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Results count */}
      <div className="px-3 py-2 text-sm text-muted-foreground">
        {loading ? "Loading..." : `${total} listings found`}
      </div>

      {/* Listing cards */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {loading && listings.length === 0 ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg border">
              <Skeleton className="w-24 h-24 rounded-md shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No listings found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isSelected={selectedId === listing.id}
                onClick={() => onSelectListing(listing)}
              />
            ))}
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
