import { createServiceClient } from "@/lib/supabase/server";
import { translateToEnglish } from "./translate";
import { extractPrice } from "./price";
import { extractLocation } from "./location";
import { categorize } from "./categorize";
import { checkDuplicate, generateContentHash } from "./deduplicate";

interface RawMessage {
  messageId: number;
  text: string;
  senderId: number | null;
  senderName: string | null;
  senderUsername: string | null;
  date: Date;
  photos: string[];
}

export async function processListing(
  raw: RawMessage,
  channelUsername: string
): Promise<void> {
  const supabase = createServiceClient();

  // 1. Translate
  const translation = await translateToEnglish(raw.text);
  const descriptionEn = translation?.translated || null;

  // 2. Extract price (check both original and translated)
  const priceResult =
    extractPrice(raw.text) ||
    (descriptionEn ? extractPrice(descriptionEn) : null);

  // 3. Extract location (check both original and translated)
  const location =
    extractLocation(raw.text) ||
    (descriptionEn ? extractLocation(descriptionEn) : null);

  // 4. Categorize
  const categoryResult = await categorize(raw.text, descriptionEn);

  // 5. Check for duplicates
  const contentHash = generateContentHash(raw.text);
  const dedupResult = await checkDuplicate(
    raw.text,
    raw.senderId,
    contentHash
  );

  // 6. Insert into database
  const { error } = await supabase.from("listings").upsert(
    {
      telegram_message_id: raw.messageId,
      telegram_channel: channelUsername,
      telegram_sender_id: raw.senderId,
      telegram_sender_name: raw.senderName,
      telegram_sender_username: raw.senderUsername,
      description_original: raw.text,
      description_en: descriptionEn,
      price: priceResult?.amount || null,
      currency: priceResult?.currency || "EUR",
      location,
      category_id: categoryResult?.categoryId || null,
      categorization_method: categoryResult?.method || null,
      content_hash: contentHash,
      is_duplicate: dedupResult.isDuplicate,
      duplicate_of: dedupResult.duplicateOf,
      photos: raw.photos,
      raw_date: raw.date.toISOString(),
    },
    { onConflict: "telegram_channel,telegram_message_id" }
  );

  if (error) {
    console.error("DB insert error:", error.message);
    throw error;
  }
}
