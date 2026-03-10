"use client";

import { useState } from "react";
import { FiltersSidebar } from "./filters-sidebar";
import { FiltersDrawer } from "./filters-drawer";
import { Feed } from "./feed";
import { DetailPanel } from "./detail-panel";
import type { Listing } from "@/types";

export function MarketplaceLayout() {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
          onSelectListing={setSelectedListing}
          selectedId={selectedListing?.id || null}
          onOpenFilters={() => setShowMobileFilters(true)}
        />
      </main>

      {/* Detail panel - desktop: side panel, mobile: bottom sheet */}
      <DetailPanel
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
      />
    </div>
  );
}
