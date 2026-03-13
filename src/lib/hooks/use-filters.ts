"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import type { ListingsFilter } from "@/types";

export function useFilters(): {
  filters: ListingsFilter;
  setFilter: (key: keyof ListingsFilter, value: string | number | undefined) => void;
  setFilters: (updates: Partial<Record<keyof ListingsFilter, string | number | undefined>>) => void;
  clearFilters: () => void;
  buildQueryString: () => string;
} {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters: ListingsFilter = {
    search: searchParams.get("search") || undefined,
    category: searchParams.get("category") || undefined,
    priceMin: searchParams.get("priceMin")
      ? Number(searchParams.get("priceMin"))
      : undefined,
    priceMax: searchParams.get("priceMax")
      ? Number(searchParams.get("priceMax"))
      : undefined,
    location: searchParams.get("location") || undefined,
    datePosted:
      (searchParams.get("datePosted") as ListingsFilter["datePosted"]) ||
      undefined,
    sort:
      (searchParams.get("sort") as ListingsFilter["sort"]) || "newest",
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
  };

  const setFilter = useCallback(
    (key: keyof ListingsFilter, value: string | number | undefined) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value === undefined || value === "" || value === "all") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }

      // Reset page when filters change (except for page itself)
      if (key !== "page") {
        params.delete("page");
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const setFilters = useCallback(
    (updates: Partial<Record<keyof ListingsFilter, string | number | undefined>>) => {
      const params = new URLSearchParams(searchParams.toString());
      let resetPage = false;

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
        if (key !== "page") resetPage = true;
      }

      if (resetPage) params.delete("page");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  const buildQueryString = useCallback(() => {
    return searchParams.toString();
  }, [searchParams]);

  return { filters, setFilter, setFilters, clearFilters, buildQueryString };
}
