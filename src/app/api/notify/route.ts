import { NextRequest, NextResponse } from "next/server";
import { runNotifications } from "@/lib/saved-searches";

export const maxDuration = 60;

/**
 * Manual notification trigger. Same auth as the crons.
 * Use to test saved-search emails end-to-end without waiting for a scrape.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runNotifications();
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
