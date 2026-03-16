"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  X,
  Send,
  ChevronLeft,
  ChevronRight,
  Globe,
  Image as ImageIcon,
  Share,
  Check,
  Heart,
  ArrowLeft,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Listing } from "@/types";
import { useAuth } from "@/lib/context/auth-context";
import { useSavedListings } from "@/lib/hooks/use-saved-listings";

interface ListingDetailProps {
  listing: Listing;
  onClose: () => void;
  variant?: "panel" | "fullscreen";
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
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ListingDetail({ listing, onClose, variant = "panel" }: ListingDetailProps) {
  const router = useRouter();
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [showRussian, setShowRussian] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user, setShowLoginDialog } = useAuth();
  const { isSaved, toggleSave } = useSavedListings();

  const isFullscreen = variant === "fullscreen";

  const handleShare = () => {
    const url = isFullscreen
      ? window.location.href
      : `${window.location.origin}/listing/${listing.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExpand = () => {
    router.push(`/listing/${listing.id}`);
  };

  const description = showRussian
    ? listing.description_original
    : listing.description_en || listing.description_original;

  const telegramLink = listing.telegram_sender_username
    ? `https://t.me/${listing.telegram_sender_username}`
    : null;

  const hasMultiplePhotos = listing.photos.length > 1;

  return (
    <div className={cn("flex flex-col", isFullscreen && "max-w-[800px] mx-auto w-full")}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between sticky top-0 bg-background z-10",
        isFullscreen ? "py-4" : "p-3"
      )}>
        <div className="flex items-center gap-2">
          {isFullscreen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              title="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h3 className={cn("font-semibold truncate", isFullscreen ? "text-xl" : "text-base")}>
            Listing details
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-xl"
            onClick={() => {
              if (!user) {
                setShowLoginDialog(true);
                return;
              }
              toggleSave(listing.id);
            }}
          >
            <Heart
              className={cn(
                "h-3.5 w-3.5 transition-colors",
                isSaved(listing.id)
                  ? "fill-red-500 text-red-500"
                  : ""
              )}
            />
            Save
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            title="Share"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Share className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={isFullscreen ? onClose : handleExpand} title={isFullscreen ? "Close" : "Open full screen"}>
            {isFullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          {!isFullscreen && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main photo */}
      {listing.photos.length > 0 ? (
        <div className={cn(
          "relative bg-muted",
          isFullscreen ? "aspect-[16/9] rounded-xl overflow-hidden" : "aspect-[4/3]"
        )}>
          <img
            src={listing.photos[currentPhoto]}
            alt=""
            className="w-full h-full object-contain"
          />
          {hasMultiplePhotos && (
            <>
              <button
                onClick={() =>
                  setCurrentPhoto((p) =>
                    p > 0 ? p - 1 : listing.photos.length - 1
                  )
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() =>
                  setCurrentPhoto((p) =>
                    p < listing.photos.length - 1 ? p + 1 : 0
                  )
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors"
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
        <div className={cn(
          "bg-muted flex items-center justify-center text-muted-foreground",
          isFullscreen ? "aspect-[16/9] rounded-xl" : "aspect-[4/3]"
        )}>
          <ImageIcon className="h-12 w-12" />
        </div>
      )}

      {/* Thumbnail strip */}
      {hasMultiplePhotos && (
        <div className={cn(
          "flex gap-1.5 py-2 overflow-x-auto",
          isFullscreen ? "px-0" : "px-3"
        )}>
          {listing.photos.map((url, i) => (
            <button
              key={i}
              onClick={() => setCurrentPhoto(i)}
              className={cn(
                "w-14 h-14 rounded-md overflow-hidden shrink-0 border-2 transition-colors",
                currentPhoto === i
                  ? "border-primary"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className={cn(
        "space-y-6",
        isFullscreen ? "py-6" : "p-4 pt-3"
      )}>
        {/* Price + Meta row */}
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <p className="text-2xl font-bold shrink-0">
            {formatPrice(listing.price, listing.currency)}
          </p>
          <div className="flex flex-wrap gap-3 items-center text-sm text-muted-foreground">
            {listing.location && (
              <span>{listing.location}</span>
            )}
            {listing.category_path && listing.category_path.length > 0 ? (
              listing.category_path.map((c, i) => (
                <span key={c.id}>{c.name}</span>
              ))
            ) : listing.category ? (
              <span>{listing.category.name}</span>
            ) : null}
            {listing.raw_date && (
              <span>{formatDate(listing.raw_date)}</span>
            )}
          </div>
        </div>

        {/* Description with language toggle */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Description</h4>
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

        {/* Seller section */}
        <div className="border-t pt-6">
          <h4 className="font-semibold mb-3">Seller</h4>
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
