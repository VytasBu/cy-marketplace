import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { translateToEnglish } from "@/lib/processing/translate";
import { extractPrice } from "@/lib/processing/price";

export const maxDuration = 300; // 5 minutes for batch processing

export async function GET(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const offset = parseInt(request.nextUrl.searchParams.get("offset") || "0");
  const batchSize = parseInt(request.nextUrl.searchParams.get("limit") || "50");
  const dryRun = request.nextUrl.searchParams.get("dryRun") === "true";

  // Fetch listings to reprocess
  const { data: listings, error } = await supabase
    .from("listings")
    .select("id, description_original, description_en, price, currency")
    .not("description_original", "is", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + batchSize - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!listings || listings.length === 0) {
    return NextResponse.json({
      message: "No more listings to reprocess",
      total: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    });
  }

  let updated = 0;
  let skipped = 0;
  let errors = 0;
  const changes: Array<{
    id: string;
    translationChanged: boolean;
    priceChanged: boolean;
    oldPrice: number | null;
    newPrice: number | null;
  }> = [];

  for (const listing of listings) {
    try {
      // 1. Re-translate
      const translation = await translateToEnglish(listing.description_original);
      const descriptionEn =
        translation?.translated || listing.description_en;

      // 2. Re-extract price (original first, then English fallback)
      const priceResult =
        extractPrice(listing.description_original) ||
        (descriptionEn ? extractPrice(descriptionEn) : null);

      const newPrice = priceResult?.amount || null;
      const newCurrency = priceResult?.currency || "EUR";

      // 3. Check if anything changed
      const translationChanged = descriptionEn !== listing.description_en;
      const priceChanged =
        newPrice !== listing.price || newCurrency !== listing.currency;

      if (!translationChanged && !priceChanged) {
        skipped++;
        continue;
      }

      if (dryRun) {
        changes.push({
          id: listing.id,
          translationChanged,
          priceChanged,
          oldPrice: listing.price,
          newPrice,
        });
        updated++;
      } else {
        const { error: updateError } = await supabase
          .from("listings")
          .update({
            description_en: descriptionEn,
            price: newPrice,
            currency: newCurrency,
          })
          .eq("id", listing.id);

        if (updateError) {
          console.error(
            `Update error for ${listing.id}:`,
            updateError.message
          );
          errors++;
        } else {
          updated++;
        }
      }

      // Rate limit for Google Translate API
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error(`Reprocess error for ${listing.id}:`, err);
      errors++;
    }
  }

  return NextResponse.json({
    success: true,
    dryRun,
    total: listings.length,
    updated,
    skipped,
    errors,
    nextOffset: offset + listings.length,
    ...(dryRun && changes.length > 0 ? { changes } : {}),
  });
}
