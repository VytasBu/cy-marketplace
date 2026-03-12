"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/context/auth-context";
import { useSavedListings } from "@/lib/hooks/use-saved-listings";
import {
  useSavedSearches,
  filtersToSearchParams,
  type SavedSearch,
} from "@/lib/hooks/use-saved-searches";
import { createClient } from "@/lib/supabase/client";
import type { Listing } from "@/types";
import {
  Heart,
  Search,
  Trash2,
  ExternalLink,
  ArrowLeft,
  MapPin,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const supabase = createClient();

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

function SavedListingsTab() {
  const { user } = useAuth();
  const { savedIds, toggleSave } = useSavedListings();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user || savedIds.size === 0) {
      setListings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/listings?ids=${Array.from(savedIds).join(",")}`)
      .then((res) => res.json())
      .then((data) => {
        setListings(data.listings || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, savedIds]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (savedIds.size === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Heart className="size-12 mb-4" />
        <p className="text-lg font-medium">No saved listings yet</p>
        <p className="text-sm mt-1">
          Click the heart icon on any listing to save it here.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/")}
        >
          Browse Listings
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {listings.map((listing) => (
        <div
          key={listing.id}
          className="rounded-lg border overflow-hidden hover:border-primary/50 transition-colors"
        >
          {/* Photo */}
          {listing.photos.length > 0 && (
            <div className="relative aspect-[4/3] bg-muted">
              <img
                src={listing.photos[0]}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => toggleSave(listing.id)}
                className="absolute top-2 right-2 size-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                <Heart className="size-4 fill-red-500 text-red-500" />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-3 space-y-1.5">
            <p className="font-semibold text-lg">
              {formatPrice(listing.price, listing.currency)}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {listing.description_en || listing.description_original}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {listing.location && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="size-3" />
                  {listing.location}
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 gap-1.5"
              onClick={() => router.push(`/?listing=${listing.id}`)}
            >
              <ExternalLink className="size-3.5" />
              View Listing
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SavedSearchesTab() {
  const { savedSearches, deleteSearch, loading } = useSavedSearches();
  const router = useRouter();

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (savedSearches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Search className="size-12 mb-4" />
        <p className="text-lg font-medium">No saved searches yet</p>
        <p className="text-sm mt-1">
          Apply filters on the main page and click &quot;Save this search&quot;
          to save them.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/")}
        >
          Browse Listings
        </Button>
      </div>
    );
  }

  const loadSearch = (search: SavedSearch) => {
    const qs = filtersToSearchParams(search.filters);
    router.push(`/${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="space-y-3 p-4">
      {savedSearches.map((search) => (
        <div
          key={search.id}
          className="rounded-lg border p-3 flex items-center gap-3 hover:bg-accent/50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{search.name}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {search.filters.search && (
                <Badge variant="secondary" className="text-xs">
                  &quot;{search.filters.search}&quot;
                </Badge>
              )}
              {search.filters.category && (
                <Badge variant="secondary" className="text-xs">
                  {search.filters.category}
                </Badge>
              )}
              {(search.filters.priceMin || search.filters.priceMax) && (
                <Badge variant="secondary" className="text-xs">
                  {search.filters.priceMin
                    ? `${search.filters.priceMin}`
                    : "0"}
                  {" - "}
                  {search.filters.priceMax
                    ? `${search.filters.priceMax}`
                    : "any"}
                </Badge>
              )}
              {search.filters.location && (
                <Badge variant="secondary" className="text-xs">
                  {search.filters.location}
                </Badge>
              )}
              {search.filters.datePosted &&
                search.filters.datePosted !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    {search.filters.datePosted}
                  </Badge>
                )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="size-3" />
              {new Date(search.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadSearch(search)}
            >
              Load
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => deleteSearch(search.id)}
              title="Delete search"
            >
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SavedPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const activeTab = searchParams.get("tab") === "searches" ? "searches" : "listings";

  // Redirect to home if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Back + Title */}
          <div className="flex items-center gap-3 p-4 pb-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <h1 className="text-xl font-bold">Saved</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-4 pt-3 border-b">
            <button
              onClick={() => router.push("/saved")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === "listings"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Heart className="size-4 inline mr-1.5 -mt-0.5" />
              Listings
            </button>
            <button
              onClick={() => router.push("/saved?tab=searches")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === "searches"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Search className="size-4 inline mr-1.5 -mt-0.5" />
              Searches
            </button>
          </div>

          {/* Tab content */}
          {activeTab === "listings" ? (
            <SavedListingsTab />
          ) : (
            <SavedSearchesTab />
          )}
        </div>
      </div>
    </div>
  );
}

export default function SavedPage() {
  return (
    <Suspense>
      <SavedPageContent />
    </Suspense>
  );
}
