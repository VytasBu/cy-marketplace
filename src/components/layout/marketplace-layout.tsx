"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { FiltersSidebar } from "./filters-sidebar";
import { FiltersDrawer } from "./filters-drawer";
import { Feed } from "./feed";
import { DetailPanel } from "./detail-panel";
import type { Listing } from "@/types";

export function MarketplaceLayout() {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const listingIdFromUrl = searchParams.get("listing");

  // Deep-link: fetch listing from URL param on mount
  useEffect(() => {
    if (listingIdFromUrl && selectedListing?.id !== listingIdFromUrl) {
      fetch(`/api/listings/${listingIdFromUrl}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && !data.error) {
            setSelectedListing(data as Listing);
          }
        })
        .catch(() => {
          // Listing not found — remove param
          const params = new URLSearchParams(searchParams.toString());
          params.delete("listing");
          const qs = params.toString();
          router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingIdFromUrl]);

  const handleSelectListing = useCallback(
    (listing: Listing) => {
      setSelectedListing(listing);
      const params = new URLSearchParams(searchParams.toString());
      params.set("listing", listing.id);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const handleCloseListing = useCallback(() => {
    setSelectedListing(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("listing");
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [searchParams, router, pathname]);

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Filters sidebar - desktop only */}
      <aside className="hidden lg:block w-[260px] border-r overflow-y-auto shrink-0">
        <FiltersSidebar />
      </aside>

      {/* Filters drawer - mobile only */}
      <FiltersDrawer
        open={showMobileFilters}
        onOpenChange={setShowMobileFilters}
      />

      {/* Feed - center column */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Feed
          onSelectListing={handleSelectListing}
          selectedId={selectedListing?.id || null}
          onOpenFilters={() => setShowMobileFilters(true)}
        />
      </main>

      {/* Detail panel - desktop: side panel, mobile: bottom sheet */}
      <DetailPanel
        listing={selectedListing}
        onClose={handleCloseListing}
      />
    </div>
  );
}
