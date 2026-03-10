"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  X,
  MapPin,
  Clock,
  Send,
  ChevronLeft,
  ChevronRight,
  Globe,
  Image as ImageIcon,
} from "lucide-react";
import type { Listing } from "@/types";

interface ListingDetailProps {
  listing: Listing;
  onClose: () => void;
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ListingDetail({ listing, onClose }: ListingDetailProps) {
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [showRussian, setShowRussian] = useState(false);

  const description = showRussian
    ? listing.description_original
    : listing.description_en || listing.description_original;

  const telegramLink = listing.telegram_sender_username
    ? `https://t.me/${listing.telegram_sender_username}`
    : null;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b sticky top-0 bg-background z-10">
        <h3 className="font-semibold truncate">Listing Details</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Photo carousel */}
      {listing.photos.length > 0 ? (
        <div className="relative aspect-[4/3] bg-muted">
          <img
            src={listing.photos[currentPhoto]}
            alt=""
            className="w-full h-full object-contain"
          />
          {listing.photos.length > 1 && (
            <>
              <button
                onClick={() =>
                  setCurrentPhoto((p) =>
                    p > 0 ? p - 1 : listing.photos.length - 1
                  )
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() =>
                  setCurrentPhoto((p) =>
                    p < listing.photos.length - 1 ? p + 1 : 0
                  )
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                {currentPhoto + 1} / {listing.photos.length}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="aspect-[4/3] bg-muted flex items-center justify-center text-muted-foreground">
          <ImageIcon className="h-12 w-12" />
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Price */}
        <p className="text-2xl font-bold">
          {formatPrice(listing.price, listing.currency)}
        </p>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-2">
          {listing.location && (
            <Badge variant="outline" className="gap-1">
              <MapPin className="h-3 w-3" />
              {listing.location}
            </Badge>
          )}
          {listing.category && (
            <Badge variant="secondary">{listing.category.name}</Badge>
          )}
          {listing.raw_date && (
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(listing.raw_date)}
            </Badge>
          )}
        </div>

        <Separator />

        {/* Description with language toggle */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Description</h4>
            {listing.description_en && listing.description_original && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs h-7"
                onClick={() => setShowRussian(!showRussian)}
              >
                <Globe className="h-3 w-3" />
                {showRussian ? "EN" : "RU"}
              </Button>
            )}
          </div>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {description}
          </p>
        </div>

        <Separator />

        {/* Seller section */}
        <div>
          <h4 className="font-medium mb-3">Seller</h4>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              {(listing.telegram_sender_name || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {listing.telegram_sender_name || "Unknown"}
              </p>
              {listing.telegram_sender_username && (
                <p className="text-sm text-muted-foreground">
                  @{listing.telegram_sender_username}
                </p>
              )}
            </div>
          </div>

          {telegramLink && (
            <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="block mt-3">
              <Button className="w-full gap-2">
                <Send className="h-4 w-4" />
                Contact on Telegram
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
