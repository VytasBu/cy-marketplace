import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const maxDuration = 30;

interface HealthCheck {
  status: "ok" | "warning" | "critical";
  message: string;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const checks: Record<string, HealthCheck> = {};
  let overallStatus: "ok" | "warning" | "critical" = "ok";

  // 1. Check last scrape time
  try {
    const { data: recent } = await supabase
      .from("listings")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (recent?.created_at) {
      const lastScrape = new Date(recent.created_at);
      const hoursAgo = (Date.now() - lastScrape.getTime()) / (1000 * 60 * 60);

      if (hoursAgo > 6) {
        checks.scraping = {
          status: "critical",
          message: `No new listings in ${Math.round(hoursAgo)} hours. Scraper may be down.`,
        };
        overallStatus = "critical";
      } else if (hoursAgo > 3) {
        checks.scraping = {
          status: "warning",
          message: `Last listing added ${Math.round(hoursAgo)} hours ago.`,
        };
        if (overallStatus !== "critical") overallStatus = "warning";
      } else {
        checks.scraping = {
          status: "ok",
          message: `Last listing added ${Math.round(hoursAgo * 60)} minutes ago.`,
        };
      }
    } else {
      checks.scraping = {
        status: "warning",
        message: "No listings found in database.",
      };
      if (overallStatus !== "critical") overallStatus = "warning";
    }
  } catch (err) {
    checks.scraping = {
      status: "critical",
      message: `DB query failed: ${err instanceof Error ? err.message : "unknown"}`,
    };
    overallStatus = "critical";
  }

  // 2. Check storage usage (estimate from listing count and photos)
  try {
    const { count: totalListings } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true });

    const { data: photoData } = await supabase
      .from("listings")
      .select("photos")
      .not("photos", "is", null);

    let totalPhotos = 0;
    if (photoData) {
      for (const row of photoData) {
        if (Array.isArray(row.photos)) {
          totalPhotos += row.photos.length;
        }
      }
    }

    // Estimate: ~50KB per compressed photo
    const estimatedMB = Math.round((totalPhotos * 50) / 1024);
    const estimatedPct = Math.round((estimatedMB / 1024) * 100); // 1GB limit

    if (estimatedPct > 80) {
      checks.storage = {
        status: "critical",
        message: `~${estimatedMB}MB used (~${estimatedPct}% of 1GB). ${totalPhotos} photos across ${totalListings} listings. Running out of space!`,
      };
      overallStatus = "critical";
    } else if (estimatedPct > 50) {
      checks.storage = {
        status: "warning",
        message: `~${estimatedMB}MB used (~${estimatedPct}% of 1GB). ${totalPhotos} photos across ${totalListings} listings.`,
      };
      if (overallStatus !== "critical") overallStatus = "warning";
    } else {
      checks.storage = {
        status: "ok",
        message: `~${estimatedMB}MB used (~${estimatedPct}% of 1GB). ${totalPhotos} photos across ${totalListings} listings.`,
      };
    }
  } catch (err) {
    checks.storage = {
      status: "warning",
      message: `Could not estimate storage: ${err instanceof Error ? err.message : "unknown"}`,
    };
    if (overallStatus !== "critical") overallStatus = "warning";
  }

  // 3. Check Google Translate
  try {
    const url = new URL(
      "https://translate.googleapis.com/translate_a/single"
    );
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", "ru");
    url.searchParams.set("tl", "en");
    url.searchParams.set("dt", "t");
    url.searchParams.set("q", "test");

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });

    if (res.ok) {
      checks.translate = { status: "ok", message: "Google Translate responding." };
    } else {
      checks.translate = {
        status: "critical",
        message: `Google Translate returned ${res.status}. May be rate-limited.`,
      };
      overallStatus = "critical";
    }
  } catch (err) {
    checks.translate = {
      status: "critical",
      message: `Google Translate unreachable: ${err instanceof Error ? err.message : "unknown"}`,
    };
    overallStatus = "critical";
  }

  // 4. Check Telegram auth (just verify env vars exist)
  const telegramVars = [
    "TELEGRAM_API_ID",
    "TELEGRAM_API_HASH",
    "TELEGRAM_STRING_SESSION",
    "TELEGRAM_CHANNEL_USERNAME",
  ];
  const missingVars = telegramVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    checks.telegram_auth = {
      status: "critical",
      message: `Missing env vars: ${missingVars.join(", ")}`,
    };
    overallStatus = "critical";
  } else {
    checks.telegram_auth = {
      status: "ok",
      message: "All Telegram env vars present.",
    };
  }

  // 5. Check untranslated listings backlog
  try {
    const { count: untranslated } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .is("description_en", null);

    if (untranslated && untranslated > 20) {
      checks.translations_backlog = {
        status: "warning",
        message: `${untranslated} listings missing English translation. Translate may be failing.`,
      };
      if (overallStatus !== "critical") overallStatus = "warning";
    } else {
      checks.translations_backlog = {
        status: "ok",
        message: `${untranslated || 0} untranslated listings.`,
      };
    }
  } catch {
    checks.translations_backlog = {
      status: "ok",
      message: "Could not check translation backlog.",
    };
  }

  const statusCode = overallStatus === "critical" ? 500 : overallStatus === "warning" ? 299 : 200;

  return NextResponse.json(
    {
      overall: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: statusCode }
  );
}
