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

export function ListingCard({
  listing,
  isSelected,
  onClick,
}: ListingCardProps) {
  const thumbnail = listing.photos[0];
  const description = listing.description_en || listing.description_original;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex gap-3 p-3 rounded-lg border text-left transition-colors hover:bg-accent/50",
        isSelected && "border-primary bg-accent"
      )}
    >
      {/* Thumbnail */}
      <div className="relative w-24 h-24 rounded-md overflow-hidden bg-muted shrink-0">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
        {listing.photos.length > 1 && (
          <span className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
            {listing.photos.length}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* Price */}
          <p className="font-semibold text-base">
            {formatPrice(listing.price, listing.currency)}
          </p>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
            {description}
          </p>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
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
