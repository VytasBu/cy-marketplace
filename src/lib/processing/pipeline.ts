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

  // 6. Handle insert or replace-older-duplicate
  if (dedupResult.isDuplicate && dedupResult.duplicateOf) {
    // Duplicate detected — only replace if this message is NEWER
    const { data: existing } = await supabase
      .from("listings")
      .select("raw_date")
      .eq("id", dedupResult.duplicateOf)
      .single();

    const existingDate = existing?.raw_date
      ? new Date(existing.raw_date)
      : new Date(0);

    if (raw.date > existingDate) {
      // New message is newer → update the existing listing in-place
      const { error } = await supabase
        .from("listings")
        .update({
          telegram_message_id: raw.messageId,
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
          photos: raw.photos,
          raw_date: raw.date.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", dedupResult.duplicateOf);

      if (error) {
        console.error("DB update (dedup replace) error:", error.message);
        throw error;
      }
      console.log(
        `Replaced older listing ${dedupResult.duplicateOf} with newer message ${raw.messageId}`
      );
    } else {
      // Existing listing is already newer — skip this older repost
      console.log(
        `Skipping older duplicate message ${raw.messageId} (existing is newer)`
      );
    }
  } else {
    // New listing — insert normally
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
        is_duplicate: false,
        duplicate_of: null,
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
}
