import { createServiceClient } from "@/lib/supabase/server";
import crypto from "crypto";

interface DedupResult {
  isDuplicate: boolean;
  duplicateOf: string | null;
}

/**
 * Generate a content hash from normalized text.
 * Used for exact duplicate detection.
 */
export function generateContentHash(text: string): string {
  const normalized = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "") // Strip all non-alphanumeric (unicode-aware)
    .slice(0, 200);

  return crypto.createHash("md5").update(normalized).digest("hex");
}

/**
 * Simple text similarity using Jaccard index on word sets.
 */
function textSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));

  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) intersection++;
  }

  const union = wordsA.size + wordsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export async function checkDuplicate(
  text: string,
  senderId: number | null,
  contentHash: string
): Promise<DedupResult> {
  const supabase = createServiceClient();

  // Check 1: Exact hash match
  const { data: exactMatch } = await supabase
    .from("listings")
    .select("id")
    .eq("content_hash", contentHash)
    .eq("is_duplicate", false)
    .limit(1)
    .single();

  if (exactMatch) {
    return { isDuplicate: true, duplicateOf: exactMatch.id };
  }

  // Check 2: Same sender + similar text (fuzzy)
  if (senderId) {
    const { data: senderListings } = await supabase
      .from("listings")
      .select("id, description_original")
      .eq("telegram_sender_id", senderId)
      .eq("is_duplicate", false)
      .order("created_at", { ascending: false })
      .limit(20);

    if (senderListings) {
      for (const listing of senderListings) {
        if (!listing.description_original) continue;
        const similarity = textSimilarity(text, listing.description_original);
        if (similarity > 0.7) {
          return { isDuplicate: true, duplicateOf: listing.id };
        }
      }
    }
  }

  return { isDuplicate: false, duplicateOf: null };
}
