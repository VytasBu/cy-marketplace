"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Listing, ListingsResponse } from "@/types";
import { useFilters } from "./use-filters";

export function useListings() {
  const { buildQueryString } = useFilters();
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(1);
  const loadingMore = useRef(false);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    pageRef.current = 1;
    try {
      const qs = buildQueryString();
      const res = await fetch(`/api/listings?${qs}`);
      const data: ListingsResponse = await res.json();
      setListings(data.listings);
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading || loadingMore.current) return;
    loadingMore.current = true;
    const nextPage = pageRef.current + 1;
    const params = new URLSearchParams(buildQueryString());
    params.set("page", String(nextPage));
    fetch(`/api/listings?${params.toString()}`)
      .then((res) => res.json())
      .then((data: ListingsResponse) => {
        pageRef.current = nextPage;
        setListings((prev) => [...prev, ...data.listings]);
        setHasMore(data.hasMore);
      })
      .finally(() => {
        loadingMore.current = false;
      });
  }, [hasMore, loading, buildQueryString]);

  return { listings, total, loading, hasMore, loadMore, refetch: fetchListings };
}
