import { NextRequest, NextResponse } from "next/server";
import { scrapeChannel } from "@/lib/telegram/scraper";

export const maxDuration = 60; // Allow up to 60s for Vercel

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
