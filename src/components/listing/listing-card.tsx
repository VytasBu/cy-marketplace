"use client";

import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Image as ImageIcon } from "lucide-react";
import type { Listing } from "@/types";
import { cn } from "@/lib/utils";

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

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
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

/** Renders the photo grid based on number of photos */
function PhotoGrid({ photos }: { photos: string[] }) {
  if (photos.length === 0) {
    return (
      <div className="aspect-[16/10] bg-muted flex items-center justify-center text-muted-foreground rounded-t-lg">
        <ImageIcon className="h-10 w-10" />
      </div>
    );
  }

  if (photos.length === 1) {
    return (
      <div className="aspect-[16/10] overflow-hidden rounded-t-lg bg-muted">
        <img
          src={photos[0]}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  if (photos.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5 aspect-[16/10] overflow-hidden rounded-t-lg">
        {photos.slice(0, 2).map((url, i) => (
          <img key={i} src={url} alt="" className="w-full h-full object-cover" />
        ))}
      </div>
    );
  }

  if (photos.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-0.5 aspect-[16/10] overflow-hidden rounded-t-lg">
        <img
          src={photos[0]}
          alt=""
          className="w-full h-full object-cover row-span-2"
        />
        <img src={photos[1]} alt="" className="w-full h-full object-cover" />
        <img src={photos[2]} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  // 4+ photos: 2x2 grid with +N overlay
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-0.5 aspect-[16/10] overflow-hidden rounded-t-lg">
      {photos.slice(0, 4).map((url, i) => (
        <div key={i} className="relative overflow-hidden">
          <img src={url} alt="" className="w-full h-full object-cover" />
          {i === 3 && photos.length > 4 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-lg font-semibold">
                +{photos.length - 4}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function ListingCard({
  listing,
  isSelected,
  onClick,
}: ListingCardProps) {
  const description = listing.description_en || listing.description_original;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border text-left transition-colors hover:bg-accent/50 overflow-hidden",
        isSelected && "border-primary bg-accent"
      )}
    >
      {/* Photo grid */}
      <PhotoGrid photos={listing.photos} />

      {/* Content */}
      <div className="p-3 space-y-1.5">
        {/* Price */}
        <p className="font-semibold text-lg">
          {formatPrice(listing.price, listing.currency)}
        </p>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {listing.location && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {listing.location}
            </span>
          )}
          {listing.category && (
            <Badge variant="secondary" className="text-xs py-0 px-1.5">
              {listing.category.name}
            </Badge>
          )}
          {listing.raw_date && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground ml-auto">
              <Clock className="h-3 w-3" />
              {timeAgo(listing.raw_date)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
