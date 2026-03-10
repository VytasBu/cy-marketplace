import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const category = searchParams.get("category");
  const priceMin = searchParams.get("priceMin");
  const priceMax = searchParams.get("priceMax");
  const location = searchParams.get("location");
  const search = searchParams.get("search");
  const datePosted = searchParams.get("datePosted");
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = (page - 1) * limit;

  const supabase = createServiceClient();

  let query = supabase
    .from("listings")
    .select("*, category:categories(*)", { count: "exact" })
    .eq("is_duplicate", false);

  // Category filter — match category and all its children
  if (category) {
    // Get all category IDs in this tree branch
    const { data: categories } = await supabase
      .from("categories")
      .select("id")
      .or(`slug.eq.${category},parent_id.in.(select id from categories where slug='${category}')`);

    if (categories && categories.length > 0) {
      const categoryIds = categories.map((c) => c.id);

      // Also get level 2 children
      const { data: subChildren } = await supabase
        .from("categories")
        .select("id")
        .in("parent_id", categoryIds);

      const allIds = [
        ...categoryIds,
        ...(subChildren?.map((c) => c.id) || []),
      ];

      query = query.in("category_id", allIds);
    }
  }

  // Price filter
  if (priceMin) {
    query = query.gte("price", parseFloat(priceMin));
  }
  if (priceMax) {
    query = query.lte("price", parseFloat(priceMax));
  }

  // Location filter
  if (location) {
    query = query.eq("location", location);
  }

  // Date filter
  if (datePosted && datePosted !== "all") {
    const now = new Date();
    let since: Date;
    switch (datePosted) {
      case "today":
        since = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "week":
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        since = new Date(0);
    }
    query = query.gte("raw_date", since.toISOString());
  }

  // Text search
  if (search) {
    query = query.or(
      `description_en.ilike.%${search}%,description_original.ilike.%${search}%`
    );
  }

  // Sorting
  switch (sort) {
    case "newest":
      query = query.order("raw_date", { ascending: false, nullsFirst: false });
      break;
    case "oldest":
      query = query.order("raw_date", { ascending: true, nullsFirst: false });
      break;
    case "price_asc":
      query = query.order("price", { ascending: true, nullsFirst: false });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    listings: data || [],
    total: count || 0,
    page,
    limit,
    hasMore: (count || 0) > offset + limit,
  });
}
