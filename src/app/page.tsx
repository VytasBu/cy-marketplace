"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MarketplaceLayout } from "@/components/layout/marketplace-layout";
import { Header } from "@/components/layout/header";
import { HomepageView } from "@/components/layout/homepage-view";
import { useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { DetailPanel } from "@/components/layout/detail-panel";
import type { Listing } from "@/types";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const hasActiveSearch = !!(
    searchParams.get("search") ||
    searchParams.get("category")
  );

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
    <div className="h-screen flex flex-col bg-canvas p-2 rounded-4xl">
      <Header variant={hasActiveSearch ? "search" : "homepage"} />
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {hasActiveSearch ? (
          <Suspense>
            <MarketplaceLayout />
          </Suspense>
        ) : (
          <main className="flex-1 min-w-0 overflow-hidden">
            <HomepageView
              onSelectListing={handleSelectListing}
              selectedId={selectedListing?.id || null}
            />
          </main>
        )}
        {selectedListing && (
          <DetailPanel
            listing={selectedListing}
            onClose={handleCloseListing}
          />
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
