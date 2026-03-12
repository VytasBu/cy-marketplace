import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = createServiceClient();

  const { data: listing, error } = await supabase
    .from("listings")
    .select("*, category:categories(*)")
    .eq("id", id)
    .single();

  if (error || !listing) {
    return NextResponse.json(
      { error: "Listing not found" },
      { status: 404 }
    );
  }

  // Build category breadcrumb path
  if (listing.category_id) {
    const { data: allCategories } = await supabase
      .from("categories")
      .select("*");

    if (allCategories) {
      const categoryMap = new Map<number, Category>();
      for (const cat of allCategories) {
        categoryMap.set(cat.id, cat as Category);
      }
      (listing as Record<string, unknown>).category_path = buildCategoryPath(
        listing.category_id,
        categoryMap
      );
    }
  }

  return NextResponse.json(listing);
}
