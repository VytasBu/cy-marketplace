"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { createClient } from "@/lib/supabase/client";
import type { ListingsFilter } from "@/types";

const supabase = createClient();

export interface SavedSearch {
  id: string;
  name: string;
  filters: ListingsFilter;
  created_at: string;
}

export function useSavedSearches() {
  const { user } = useAuth();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch saved searches on mount
  useEffect(() => {
    if (!user) {
      setSavedSearches([]);
      return;
    }

    setLoading(true);
    supabase
      .from("saved_searches")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setSavedSearches(data as SavedSearch[]);
        }
        setLoading(false);
      });
  }, [user]);

  const saveSearch = useCallback(
    async (name: string, filters: ListingsFilter) => {
      if (!user) return;

      const { data, error } = await supabase
        .from("saved_searches")
        .insert({
          user_id: user.id,
          name,
          filters: filters as unknown as Record<string, unknown>,
        })
        .select()
        .single();

      if (!error && data) {
        setSavedSearches((prev) => [data as SavedSearch, ...prev]);
      }

      return { error: error?.message ?? null };
    },
    [user]
  );

  const deleteSearch = useCallback(
    async (searchId: string) => {
      if (!user) return;

      // Optimistic delete
      setSavedSearches((prev) => prev.filter((s) => s.id !== searchId));

      const { error } = await supabase
        .from("saved_searches")
        .delete()
        .eq("id", searchId)
        .eq("user_id", user.id);

      if (error) {
        // Refetch on error
        const { data } = await supabase
          .from("saved_searches")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (data) setSavedSearches(data as SavedSearch[]);
      }
    },
    [user]
  );

  return { savedSearches, saveSearch, deleteSearch, loading };
}

/** Convert a ListingsFilter object to URL search params string */
export function filtersToSearchParams(filters: ListingsFilter): string {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.priceMin !== undefined)
    params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax !== undefined)
    params.set("priceMax", String(filters.priceMax));
  if (filters.location) params.set("location", filters.location);
  if (filters.datePosted && filters.datePosted !== "all")
    params.set("datePosted", filters.datePosted);
  if (filters.sort && filters.sort !== "newest")
    params.set("sort", filters.sort);

  return params.toString();
}
