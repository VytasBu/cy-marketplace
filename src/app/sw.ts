// @ts-nocheck
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Never cache auth routes
    {
      urlPattern: /\/auth\/.*/,
      handler: "NetworkOnly",
      method: "GET",
    },
    // Never cache server-side cron/admin APIs
    {
      urlPattern: /\/api\/(scrape|cleanup|recategorize|translate-backfill|health)/,
      handler: "NetworkOnly",
      method: "GET",
    },
    // Categories API — rarely changes
    {
      urlPattern: /\/api\/categories/,
      handler: "StaleWhileRevalidate",
      method: "GET",
      options: {
        cacheName: "api-categories",
        expiration: {
          maxAgeSeconds: 86400, // 24 hours
        },
      },
    },
    // Listings API — needs fresh data, fallback to cache when offline
    {
      urlPattern: /\/api\/listings/,
      handler: "NetworkFirst",
      method: "GET",
      options: {
        cacheName: "api-listings",
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 3600, // 1 hour
        },
      },
    },
    // Supabase Storage images — immutable, cache aggressively
    {
      urlPattern: ({ url }: { url: URL }) =>
        url.hostname.includes("supabase") &&
        url.pathname.includes("/storage/"),
      handler: "CacheFirst",
      method: "GET",
      options: {
        cacheName: "listing-images",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 3600, // 30 days
        },
      },
    },
    // Google Fonts
    {
      urlPattern: ({ url }: { url: URL }) =>
        url.hostname === "fonts.googleapis.com" ||
        url.hostname === "fonts.gstatic.com",
      handler: "CacheFirst",
      method: "GET",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 3600, // 1 year
        },
      },
    },
    // Fall back to default cache for everything else
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }: { request: Request }) =>
          request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
