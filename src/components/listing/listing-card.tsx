"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, Image as ImageIcon, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import type { Listing } from "@/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/context/auth-context";
import { useSavedListings } from "@/lib/hooks/use-saved-listings";

interface ListingCardProps {
  listing: Listing;
  isSelected: boolean;
  onClick: () => void;
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 30) return `${diffDays}d`;
  return date.toLocaleDateString();
}

function formatPrice(price: number | null, currency: string): string {
  if (price === null) return "Price on request";
  const symbols: Record<string, string> = {
    EUR: "\u20AC",
    USD: "$",
    GBP: "\u00A3",
    RUB: "\u20BD",
  };
  const symbol = symbols[currency] || currency;
  return `${symbol}${price.toLocaleString()}`;
}

export function ListingCard({
  listing,
  isSelected,
  onClick,
}: ListingCardProps) {
  const description = listing.description_en || listing.description_original;
  const { user, setShowLoginDialog } = useAuth();
  const { isSaved, toggleSave } = useSavedListings();
  const [photoIndex, setPhotoIndex] = useState(0);

  const photos = listing.photos || [];
  const photoCount = photos.length;
  const currentPhoto = photos[photoIndex];

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    toggleSave(listing.id);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((i) => (i > 0 ? i - 1 : photoCount - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((i) => (i < photoCount - 1 ? i + 1 : 0));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      className={cn(
        "w-full rounded-lg border text-left transition-colors hover:bg-accent/50 overflow-hidden flex flex-col relative group cursor-pointer",
        isSelected && "border-primary bg-accent"
      )}
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {currentPhoto ? (
          <img
            src={currentPhoto}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}

        {/* Photo count badge */}
        {photoCount > 1 && (
          <span className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
            {photoIndex + 1} / {photoCount}
          </span>
        )}

        {/* Navigation arrows — visible on hover when multiple photos */}
        {photoCount > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 size-7 rounded-full bg-white/90 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronLeft className="size-4 text-gray-700" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 size-7 rounded-full bg-white/90 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronRight className="size-4 text-gray-700" />
            </button>
          </>
        )}

        {/* Heart button */}
        <button
          onClick={handleHeartClick}
          className="absolute top-2 right-2 z-10 size-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-black/60 opacity-0 group-hover:opacity-100 data-[saved=true]:opacity-100"
          data-saved={isSaved(listing.id)}
        >
          <Heart
            className={cn(
              "size-4 transition-colors",
              isSaved(listing.id)
                ? "fill-red-500 text-red-500"
                : "text-white"
            )}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-2.5 space-y-1 min-w-0">
        {/* Price + time */}
        <div className="flex items-center justify-between gap-1">
          <p className="font-bold text-base">
            {formatPrice(listing.price, listing.currency)}
          </p>
          {listing.raw_date && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0">
              <Clock className="h-3 w-3" />
              {timeAgo(listing.raw_date)}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
          {description}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {listing.category_path && listing.category_path.length > 0 && (
            <span className="text-xs text-muted-foreground truncate">
              {listing.category_path.slice(-2).map((c) => c.name).join(" › ")}
            </span>
          )}
          {!listing.category_path && listing.category && (
            <Badge variant="secondary" className="text-xs py-0 px-1.5">
              {listing.category.name}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
