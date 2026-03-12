import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

// Build breadcrumb path for a category: [root, ..., leaf]
function buildCategoryPath(
  categoryId: number,
  categoryMap: Map<number, Category>
): Category[] {
  const path: Category[] = [];
  let current = categoryMap.get(categoryId);
  while (current) {
    path.unshift(current);
    current = current.parent_id ? categoryMap.get(current.parent_id) : undefined;
  }
  return path;
}

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
    .eq("is_duplicate", false)
    .not("photos", "eq", "{}"); // Hide listings with no photos

  // Category filter — match category and all its children/grandchildren
  if (category) {
    // Step 1: Find the selected category by slug
    const { data: selectedCat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category)
      .single();

    if (selectedCat) {
      // Step 2: Find direct children
      const { data: children } = await supabase
        .from("categories")
        .select("id")
        .eq("parent_id", selectedCat.id);

      const childIds = children?.map((c) => c.id) || [];

      // Step 3: Find grandchildren (level 2)
      let grandchildIds: number[] = [];
      if (childIds.length > 0) {
        const { data: grandchildren } = await supabase
          .from("categories")
          .select("id")
          .in("parent_id", childIds);
        grandchildIds = grandchildren?.map((c) => c.id) || [];
      }

      // Combine: selected + children + grandchildren
      const allIds = [selectedCat.id, ...childIds, ...grandchildIds];
      query = query.in("category_id", allIds);
    } else {
      // Category slug not found — return empty results
      return NextResponse.json({
        listings: [],
        total: 0,
        page,
        limit,
        hasMore: false,
      });
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

  // Build category breadcrumb paths
  const listings = data || [];
  if (listings.length > 0) {
    // Fetch all categories once to build lookup map
    const { data: allCategories } = await supabase
      .from("categories")
      .select("*");

    if (allCategories) {
      const categoryMap = new Map<number, Category>();
      for (const cat of allCategories) {
        categoryMap.set(cat.id, cat as Category);
      }

      for (const listing of listings) {
        if (listing.category_id) {
          (listing as Record<string, unknown>).category_path =
            buildCategoryPath(listing.category_id, categoryMap);
        }
      }
    }
  }

  return NextResponse.json({
    listings,
    total: count || 0,
    page,
    limit,
    hasMore: (count || 0) > offset + limit,
  });
}
