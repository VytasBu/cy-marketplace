import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  // 1. Find old listings
  const { data: oldListings, error: fetchError } = await supabase
    .from("listings")
    .select("id, photos")
    .lt("raw_date", cutoff.toISOString())
    .limit(100);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!oldListings || oldListings.length === 0) {
    return NextResponse.json({ message: "No old listings to clean up", deleted: 0 });
  }

  // 2. Delete photos from storage
  let photosDeleted = 0;
  for (const listing of oldListings) {
    if (listing.photos && listing.photos.length > 0) {
      // Extract storage paths from public URLs
      const paths = listing.photos
        .map((url: string) => {
          const match = url.match(/listing-photos\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter(Boolean) as string[];

      if (paths.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from("listing-photos")
          .remove(paths);

        if (!deleteError) {
          photosDeleted += paths.length;
        }
      }
    }
  }

  // 3. Delete listing rows
  const ids = oldListings.map((l) => l.id);
  const { error: deleteError } = await supabase
    .from("listings")
    .delete()
    .in("id", ids);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    deleted: oldListings.length,
    photosDeleted,
  });
}
