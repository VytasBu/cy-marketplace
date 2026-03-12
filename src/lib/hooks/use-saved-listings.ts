"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export function useSavedListings() {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch saved listing IDs on mount (when user is available)
  useEffect(() => {
    if (!user) {
      setSavedIds(new Set());
      return;
    }

    setLoading(true);
    supabase
      .from("saved_listings")
      .select("listing_id")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (!error && data) {
          setSavedIds(new Set(data.map((row) => row.listing_id)));
        }
        setLoading(false);
      });
  }, [user]);

  const isSaved = useCallback(
    (listingId: string) => savedIds.has(listingId),
    [savedIds]
  );

  const toggleSave = useCallback(
    async (listingId: string) => {
      if (!user) return;

      const wasSaved = savedIds.has(listingId);

      // Optimistic update
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) {
          next.delete(listingId);
        } else {
          next.add(listingId);
        }
        return next;
      });

      if (wasSaved) {
        const { error } = await supabase
          .from("saved_listings")
          .delete()
          .eq("user_id", user.id)
          .eq("listing_id", listingId);

        if (error) {
          // Revert on failure
          setSavedIds((prev) => new Set([...prev, listingId]));
        }
      } else {
        const { error } = await supabase.from("saved_listings").insert({
          user_id: user.id,
          listing_id: listingId,
        });

        if (error) {
          // Revert on failure
          setSavedIds((prev) => {
            const next = new Set(prev);
            next.delete(listingId);
            return next;
          });
        }
      }
    },
    [user, savedIds]
  );

  return { savedIds, isSaved, toggleSave, loading };
}
