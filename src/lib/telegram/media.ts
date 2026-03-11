import { TelegramClient } from "telegram";
import { Api } from "telegram/tl";
import sharp from "sharp";
import { createServiceClient } from "@/lib/supabase/server";

export async function downloadAndUploadPhotos(
  client: TelegramClient,
  message: Api.Message,
  listingId: string
): Promise<string[]> {
  const supabase = createServiceClient();
  const photos: string[] = [];

  // Handle single photo
  if (message.photo) {
    const buffer = await client.downloadMedia(message, {});
    if (buffer && Buffer.isBuffer(buffer)) {
      const url = await uploadToSupabase(supabase, buffer, listingId, 0);
      if (url) photos.push(url);
    }
  }

  // Handle grouped media (album)
  if (message.groupedId) {
    // Grouped media is handled at the scraper level
    // Individual photos in a group are processed as separate messages
    return photos;
  }

  // Handle document (sometimes images are sent as documents)
  if (message.document) {
    const doc = message.document as Api.Document;
    const isImage = doc.mimeType?.startsWith("image/");
    if (isImage) {
      const buffer = await client.downloadMedia(message, {});
      if (buffer && Buffer.isBuffer(buffer)) {
        const url = await uploadToSupabase(supabase, buffer, listingId, 0);
        if (url) photos.push(url);
      }
    }
  }

  return photos;
}

async function uploadToSupabase(
  supabase: ReturnType<typeof createServiceClient>,
  buffer: Buffer,
  listingId: string,
  index: number
): Promise<string | null> {
  const path = `${listingId}/${index}.jpg`;

  // Compress: resize to max 800px width, JPEG quality 70
  let compressed: Buffer;
  try {
    compressed = await sharp(buffer)
      .resize(800, undefined, { withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer();
  } catch {
    // If sharp fails (e.g. corrupted image), use original
    compressed = buffer;
  }

  const { error } = await supabase.storage
    .from("listing-photos")
    .upload(path, compressed, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) {
    console.error("Upload error:", error.message);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("listing-photos").getPublicUrl(path);

  return publicUrl;
}
