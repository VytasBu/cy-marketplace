import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { categorize, clearCategoryCache } from "@/lib/processing/categorize";

export const maxDuration = 300; // 5 minutes for batch processing

export async function GET(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Clear category cache to ensure fresh data
  clearCategoryCache();

  // force=true re-categorizes ALL listings (e.g. after expanding category tree)
  const force = request.nextUrl.searchParams.get("force") === "true";
  const offset = parseInt(request.nextUrl.searchParams.get("offset") || "0");
  const batchSize = parseInt(request.nextUrl.searchParams.get("limit") || "100");

  // Fetch listings to recategorize
  let query = supabase
    .from("listings")
    .select("id, description_original, description_en, categorization_method")
    .order("created_at", { ascending: false })
    .range(offset, offset + batchSize - 1);

  if (!force) {
    query = query.eq("categorization_method", "keyword");
  }

  const { data: listings, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!listings || listings.length === 0) {
    return NextResponse.json({ message: "No listings to recategorize", updated: 0 });
  }

  let updated = 0;
  let errors = 0;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (const listing of listings) {
    try {
      const result = await categorize(
        listing.description_original || "",
        listing.description_en || null
      );

      if (result && result.method === "llm") {
        await supabase
          .from("listings")
          .update({
            category_id: result.categoryId,
            categorization_method: result.method,
          })
          .eq("id", listing.id);
        updated++;
      }

      // Rate limit: ~200ms between LLM calls
      await sleep(200);
    } catch (err) {
      console.error(`Error recategorizing ${listing.id}:`, err);
      errors++;
    }
  }

  return NextResponse.json({
    message: `Recategorized ${updated} listings (${errors} errors)`,
    total: listings.length,
    updated,
    errors,
  });
}
