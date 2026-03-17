"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  X,
  Send,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  Share,
  Check,
  Heart,
  ArrowLeft,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ru", label: "Russian" },
];

export function ListingDetail({ listing, onClose, variant = "panel" }: ListingDetailProps) {
  const router = useRouter();
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [language, setLanguage] = useState<"en" | "ru">("en");
  const [langOpen, setLangOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user, setShowLoginDialog } = useAuth();
  const { isSaved, toggleSave } = useSavedListings();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  // Sync carousel selected index → currentPhoto state
  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setCurrentPhoto(carouselApi.selectedScrollSnap());
    carouselApi.on("select", onSelect);
    return () => { carouselApi.off("select", onSelect); };
  }, [carouselApi]);

  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!langOpen) return;
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [langOpen]);

  const isFullscreen = variant === "fullscreen";
  const contentPx = isFullscreen ? "px-0" : "px-5";

  const handleExpand = () => {
    router.push(`/listing/${listing.id}`);
  };

  const handleShare = () => {
    const url = isFullscreen
      ? window.location.href
      : `${window.location.origin}/listing/${listing.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const description = language === "ru"
    ? listing.description_original
    : listing.description_en || listing.description_original;

  const telegramLink = listing.telegram_sender_username
    ? `https://t.me/${listing.telegram_sender_username}`
    : null;

  const hasMultiplePhotos = listing.photos.length > 1;
  const hasTranslation = !!(listing.description_en && listing.description_original);

  return (
    <div className={cn("flex flex-col", isFullscreen && "max-w-[800px] mx-auto w-full")}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between sticky top-0 bg-background z-10",
        isFullscreen ? "py-4" : "p-4 pb-3",
        isFullscreen ? "" : "rounded-t-3xl"
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-1.5"
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
                "h-4 w-4 transition-colors",
                isSaved(listing.id)
                  ? "fill-red-500 text-red-500"
                  : ""
              )}
            />
            Save
          </Button>
          <Button
            variant="outline"
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
          {!isFullscreen && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleExpand}
              title="Open full screen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main photo — swipeable carousel */}
      <div className={contentPx}>
        {listing.photos.length > 0 ? (
          <Carousel
            opts={{ loop: true }}
            setApi={setCarouselApi}
            className="relative"
          >
            <CarouselContent className="ml-0">
              {listing.photos.map((url, i) => (
                <CarouselItem key={i} className="pl-0">
                  <div className="bg-muted aspect-[16/10] rounded-2xl overflow-hidden">
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {hasMultiplePhotos && (
              <>
                <button
                  onClick={() => carouselApi?.scrollPrev()}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors z-10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => carouselApi?.scrollNext()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors z-10"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-10">
                  {currentPhoto + 1} / {listing.photos.length}
                </div>
              </>
            )}
          </Carousel>
        ) : (
          <div className="bg-muted flex items-center justify-center text-muted-foreground aspect-[16/10] rounded-2xl">
            <ImageIcon className="h-12 w-12" />
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {hasMultiplePhotos && (
        <div className={cn("flex gap-1.5 py-2 overflow-x-auto", contentPx)}>
          {listing.photos.map((url, i) => (
            <button
              key={i}
              onClick={() => carouselApi?.scrollTo(i)}
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
      <div className={cn("space-y-5 pt-4 pb-6", contentPx)}>
        {/* Price + Meta row */}
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <p className="text-2xl font-bold shrink-0">
            {formatPrice(listing.price, listing.currency)}
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            {listing.location && (
              <Badge variant="outline">{listing.location}</Badge>
            )}
            {listing.category_path && listing.category_path.length > 0 ? (
              listing.category_path.map((c) => (
                <Badge key={c.id} variant="outline">{c.name}</Badge>
              ))
            ) : listing.category ? (
              <Badge variant="outline">{listing.category.name}</Badge>
            ) : null}
            {listing.raw_date && (
              <Badge variant="outline">{formatDate(listing.raw_date)}</Badge>
            )}
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-border" />

        {/* Description with language selector */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Description</h4>
            {hasTranslation && (
              <div ref={langRef} className="relative">
                <button
                  onClick={() => setLangOpen((o) => !o)}
                  className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {language === "en" ? "EN" : "RU"}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {langOpen && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-[140px] p-1 rounded-xl border bg-popover shadow-md">
                    {LANGUAGES.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => {
                          setLanguage(value as "en" | "ru");
                          setLangOpen(false);
                        }}
                        className={cn(
                          "w-full text-left text-sm py-1.5 px-2 rounded-md hover:bg-accent flex items-center justify-between",
                          language === value && "bg-primary/10 text-primary font-medium"
                        )}
                      >
                        {label}
                        {language === value && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {description}
          </p>
        </div>

        {/* Separator */}
        <div className="border-t border-border" />

        {/* Seller section */}
        <div>
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
