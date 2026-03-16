"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { ListingDetail } from "@/components/listing/listing-detail";
import { Skeleton } from "@/components/ui/skeleton";
import type { Listing } from "@/types";

export default function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setListing(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleClose = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-canvas p-2 rounded-4xl">
      <Header variant="search" />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="h-full bg-background rounded-3xl">
          <div className="max-w-[1240px] mx-auto px-6 py-6">
            {loading ? (
              <div className="max-w-[800px] mx-auto space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="aspect-[16/9] w-full rounded-xl" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : error || !listing ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <p className="text-lg font-medium">Listing not found</p>
                <p className="text-sm mt-1">This listing may have been removed</p>
              </div>
            ) : (
              <ListingDetail
                listing={listing}
                onClose={handleClose}
                variant="fullscreen"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
