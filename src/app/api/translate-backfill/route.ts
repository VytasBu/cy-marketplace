import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { translateToEnglish } from "@/lib/processing/translate";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Fetch listings missing English translation
  const { data: listings, error } = await supabase
    .from("listings")
    .select("id, description_original")
    .is("description_en", null)
    .not("description_original", "is", null)
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!listings || listings.length === 0) {
    return NextResponse.json({ message: "No listings to translate", translated: 0 });
  }

  let translated = 0;
  let errors = 0;

  for (const listing of listings) {
    try {
      const result = await translateToEnglish(listing.description_original);
      if (result) {
        const { error: updateError } = await supabase
          .from("listings")
          .update({ description_en: result.translated })
          .eq("id", listing.id);

        if (updateError) {
          console.error(`Update error for ${listing.id}:`, updateError.message);
          errors++;
        } else {
          translated++;
        }
      }
      // Small delay to be respectful to the API
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error(`Translation error for ${listing.id}:`, err);
      errors++;
    }
  }

  return NextResponse.json({
    success: true,
    total: listings.length,
    translated,
    errors,
  });
}
