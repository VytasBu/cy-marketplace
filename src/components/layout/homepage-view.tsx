"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useFilters } from "@/lib/hooks/use-filters";
import { ListingCard } from "@/components/listing/listing-card";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutGrid } from "lucide-react";
import type { Category, Listing, ListingsResponse } from "@/types";

interface HomepageViewProps {
  onSelectListing: (listing: Listing) => void;
  selectedId: string | null;
}

export function HomepageView({
  onSelectListing,
  selectedId,
}: HomepageViewProps) {
  const { setFilter } = useFilters();
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingListings, setLoadingListings] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(1);
  const loadingMoreRef = useRef(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {})
      .finally(() => setLoadingCategories(false));
  }, []);

  useEffect(() => {
    fetch("/api/listings?sort=newest&limit=20")
      .then((r) => r.json())
      .then((d: ListingsResponse) => {
        setListings(d.listings);
        setHasMore(d.hasMore);
      })
      .catch(() => {})
      .finally(() => setLoadingListings(false));
  }, []);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    const nextPage = pageRef.current + 1;
    fetch(`/api/listings?sort=newest&limit=20&page=${nextPage}`)
      .then((r) => r.json())
      .then((d: ListingsResponse) => {
        pageRef.current = nextPage;
        setListings((prev) => [...prev, ...d.listings]);
        setHasMore(d.hasMore);
      })
      .finally(() => {
        loadingMoreRef.current = false;
      });
  }, [hasMore]);

  // Infinite scroll observer
  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingListings) {
          loadMore();
        }
      },
      { root: scrollRef.current, threshold: 0.1, rootMargin: "0px 0px 400px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingListings, loadMore]);

  const roots = categories.filter((c) => c.parent_id === null);
  const ROW_SIZE = 8;
  const visibleCategories = showAllCategories
    ? roots
    : roots.slice(0, ROW_SIZE * 2 - 1);

  const handleCategoryClick = useCallback(
    (slug: string) => {
      setFilter("category", slug);
    },
    [setFilter]
  );

  return (
    <div ref={scrollRef} className="h-full bg-background rounded-3xl py-9 overflow-y-auto overflow-x-hidden">
      <div className="mx-auto px-6 xl:px-[15%] space-y-12">
        {/* Browse categories */}
        <section className="space-y-6">
          <h2 className="text-center text-3xl font-medium text-foreground">
            Browse categories
          </h2>

          {loadingCategories ? (
            <div className="flex flex-wrap justify-center gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Skeleton className="w-[100px] h-[100px] rounded-2xl" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-5">
              {visibleCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className="flex flex-col items-center gap-2 group cursor-pointer w-[120px]"
                >
                  <div className="w-[100px] h-[100px] rounded-2xl border bg-card flex items-center justify-center text-3xl transition-colors group-hover:bg-accent">
                    {cat.icon || (
                      <LayoutGrid className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-foreground text-center leading-tight">
                    {cat.name}
                  </span>
                </button>
              ))}

              {!showAllCategories && roots.length > ROW_SIZE * 2 - 1 && (
                <button
                  onClick={() => setShowAllCategories(true)}
                  className="flex flex-col items-center gap-2 group cursor-pointer w-[120px]"
                >
                  <div className="w-[100px] h-[100px] rounded-2xl border bg-card flex items-center justify-center transition-colors group-hover:bg-accent">
                    <LayoutGrid className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <span className="text-xs font-medium text-foreground text-center leading-tight">
                    Expand all
                  </span>
                </button>
              )}
            </div>
          )}
        </section>

        {/* Newest ads */}
        <section className="space-y-6">
          <h2 className="text-center text-2xl font-medium text-foreground">
            Newest ads
          </h2>

          {loadingListings ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-xl border overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <div className="p-2.5 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    isSelected={selectedId === listing.id}
                    onClick={() => onSelectListing(listing)}
                  />
                ))}
              </div>
              <div ref={observerRef} className="h-4" />
              {loadingMoreRef.current && (
                <div className="flex justify-center py-4">
                  <Skeleton className="h-8 w-32" />
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
