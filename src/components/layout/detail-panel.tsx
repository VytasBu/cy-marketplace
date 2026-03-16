"use client";

import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { ListingDetail } from "@/components/listing/listing-detail";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Listing } from "@/types";

interface DetailPanelProps {
  listing: Listing | null;
  onClose: () => void;
}

export function DetailPanel({ listing, onClose }: DetailPanelProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Desktop: right-side sheet overlay with slide-in animation
  if (isDesktop) {
    return (
      <Sheet open={!!listing} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          showCloseButton={false}
          overlayClassName="bg-transparent backdrop-blur-none"
          className="sm:max-w-[50vw] w-[50vw] p-0 overflow-y-auto"
        >
          <SheetTitle className="sr-only">Listing details</SheetTitle>
          {listing && (
            <ListingDetail listing={listing} onClose={onClose} variant="panel" />
          )}
        </SheetContent>
      </Sheet>
    );
  }

  // Mobile: bottom sheet
  if (!listing) return null;
  return (
    <Drawer open={!!listing} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerTitle className="sr-only">Listing details</DrawerTitle>
        <div className="overflow-y-auto">
          <ListingDetail listing={listing} onClose={onClose} variant="panel" />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
