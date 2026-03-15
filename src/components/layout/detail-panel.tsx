"use client";

import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { ListingDetail } from "@/components/listing/listing-detail";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import type { Listing } from "@/types";

interface DetailPanelProps {
  listing: Listing | null;
  onClose: () => void;
}

export function DetailPanel({ listing, onClose }: DetailPanelProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!listing) return null;

  // Desktop: side panel
  if (isDesktop) {
    return (
      <aside className="w-[400px] border-l overflow-y-auto shrink-0 bg-background">
        <ListingDetail listing={listing} onClose={onClose} />
      </aside>
    );
  }

  // Mobile: bottom sheet
  return (
    <Drawer open={!!listing} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerTitle className="sr-only">Listing details</DrawerTitle>
        <div className="overflow-y-auto">
          <ListingDetail listing={listing} onClose={onClose} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
