import { NextRequest, NextResponse } from "next/server";
import { scrapeChannel } from "@/lib/telegram/scraper";
import { makePgClient } from "@/lib/supabase/pg";

export const maxDuration = 60; // Allow up to 60s for Vercel

// Refuse to scrape if the bucket is already over this. /api/cleanup's
// TARGET is 750 MB; if we're at 1000 MB the cleanup cron is failing or
// behind — better to skip a scrape window than push us over the quota
// and break the whole app again.
const SCRAPE_HARD_LIMIT_BYTES = 1000 * 1024 * 1024;

async function bucketIsOverLimit(): Promise<{ over: boolean; bytes: number }> {
  const pg = makePgClient();
  try {
    await pg.connect();
    const { rows: [r] } = await pg.query<{ bytes: string }>(
      `select coalesce(sum((metadata->>'size')::bigint), 0)::text as bytes
       from storage.objects where bucket_id = 'listing-photos'`
    );
    const bytes = Number(r.bytes);
    return { over: bytes > SCRAPE_HARD_LIMIT_BYTES, bytes };
  } finally {
    await pg.end().catch(() => {});
  }
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Storage kill-switch — never scrape past the hard cap.
  try {
    const { over, bytes } = await bucketIsOverLimit();
    if (over) {
      return NextResponse.json({
        skipped: true,
        reason: "storage_over_limit",
        bytesMB: Math.round(bytes / 1024 / 1024),
        limitMB: Math.round(SCRAPE_HARD_LIMIT_BYTES / 1024 / 1024),
      });
    }
  } catch (e) {
    // Don't block scraping on a check failure — log and continue.
    console.error("Storage check failed:", e);
  }

  try {
    const direction =
      request.nextUrl.searchParams.get("direction") === "backward"
        ? "backward"
        : "forward";
    const offsetIdParam = request.nextUrl.searchParams.get("offsetId");
    const offsetId = offsetIdParam ? parseInt(offsetIdParam) : undefined;

    const result = await scrapeChannel(direction, offsetId);
    return NextResponse.json({
      success: true,
      direction,
      processed: result.processed,
      errors: result.errors,
      oldestId: result.oldestId,
      batches: result.batches,
    });
  } catch (error) {
    console.error("Scrape error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    // Classify the error for monitoring
    let errorType = "unknown";
    if (message.includes("AUTH_KEY") || message.includes("session")) {
      errorType = "auth_expired";
    } else if (message.includes("FLOOD") || message.includes("rate")) {
      errorType = "rate_limited";
    } else if (message.includes("timeout") || message.includes("TIMEOUT")) {
      errorType = "timeout";
    } else if (message.includes("CHANNEL") || message.includes("not found")) {
      errorType = "channel_error";
    }

    return NextResponse.json(
      { error: message, errorType, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
