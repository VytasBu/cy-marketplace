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
    });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
