import { TelegramClient } from "telegram";
import { Api } from "telegram/tl";
import sharp from "sharp";
import { r2Upload } from "@/lib/r2";

export async function downloadAndUploadPhotos(
  client: TelegramClient,
  message: Api.Message,
  listingId: string
): Promise<string[]> {
  const photos: string[] = [];

  if (message.photo) {
    const buffer = await client.downloadMedia(message, {});
    if (buffer && Buffer.isBuffer(buffer)) {
      const url = await uploadPhoto(buffer, listingId, 0);
      if (url) photos.push(url);
    }
  }

  if (message.groupedId) {
    return photos;
  }

  if (message.document) {
    const doc = message.document as Api.Document;
    const isImage = doc.mimeType?.startsWith("image/");
    if (isImage) {
      const buffer = await client.downloadMedia(message, {});
      if (buffer && Buffer.isBuffer(buffer)) {
        const url = await uploadPhoto(buffer, listingId, 0);
        if (url) photos.push(url);
      }
    }
  }

  return photos;
}

async function uploadPhoto(
  buffer: Buffer,
  listingId: string,
  index: number
): Promise<string | null> {
  const key = `${listingId}/${index}.webp`;

  // WebP q=70 at 600px wide.
  let compressed: Buffer;
  let contentType = "image/webp";
  try {
    compressed = await sharp(buffer)
      .resize(600, undefined, { withoutEnlargement: true })
      .webp({ quality: 70 })
      .toBuffer();
  } catch {
    // If sharp fails (e.g. corrupted image), fall back to raw JPEG.
    compressed = buffer;
    contentType = "image/jpeg";
  }

  try {
    return await r2Upload(key, compressed, contentType);
  } catch (e) {
    console.error("R2 upload failed:", e);
    return null;
  }
}
