import { NextRequest, NextResponse } from "next/server";
import { scrapeChannel } from "@/lib/telegram/scraper";
import { r2BucketBytes } from "@/lib/r2";

export const maxDuration = 60; // Allow up to 60s for Vercel

// Refuse to scrape if the R2 bucket is already over this. R2 free tier
// is 10 GB — this cap leaves ~35× headroom and gives us time to notice
// before we ever pay a cent. Also protects against a leaked-key runaway
// scraper by refusing to keep uploading past the threshold.
const SCRAPE_HARD_LIMIT_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB

async function bucketIsOverLimit(): Promise<{ over: boolean; bytes: number }> {
  const bytes = await r2BucketBytes();
  return { over: bytes > SCRAPE_HARD_LIMIT_BYTES, bytes };
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
