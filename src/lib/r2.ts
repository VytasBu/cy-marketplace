/**
 * Cloudflare R2 client + helpers.
 *
 * R2 is S3-compatible, so we use @aws-sdk/client-s3 pointed at Cloudflare's
 * endpoint. Public URLs come from the r2.dev subdomain configured on the
 * bucket.
 */
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

const BUCKET = process.env.R2_BUCKET!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;
  client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  return client;
}

export async function r2Upload(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return `${PUBLIC_URL}/${key}`;
}

const DELETE_CHUNK = 900; // S3 batch delete cap is 1000

export async function r2DeleteMany(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;
  let deleted = 0;
  const c = getClient();
  for (let i = 0; i < keys.length; i += DELETE_CHUNK) {
    const chunk = keys.slice(i, i + DELETE_CHUNK);
    const res = await c.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: chunk.map((k) => ({ Key: k })), Quiet: true },
      })
    );
    // Count = requested minus explicit errors (Quiet=true skips success entries)
    const errors = res.Errors?.length ?? 0;
    deleted += chunk.length - errors;
  }
  return deleted;
}

export async function r2ListAll(): Promise<{ key: string; size: number }[]> {
  const c = getClient();
  const out: { key: string; size: number }[] = [];
  let ContinuationToken: string | undefined;
  do {
    const res: import("@aws-sdk/client-s3").ListObjectsV2CommandOutput =
      await c.send(
        new ListObjectsV2Command({
          Bucket: BUCKET,
          ContinuationToken,
        })
      );
    for (const o of res.Contents ?? []) {
      if (o.Key) out.push({ key: o.Key, size: o.Size ?? 0 });
    }
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return out;
}

export async function r2BucketBytes(): Promise<number> {
  const objects = await r2ListAll();
  return objects.reduce((sum, o) => sum + o.size, 0);
}

/** Extract the R2 object key from a public URL (or null if it's not R2). */
export function r2KeyFromUrl(url: string): string | null {
  if (!url.startsWith(PUBLIC_URL)) return null;
  return url.slice(PUBLIC_URL.length + 1); // +1 to strip the leading "/"
}
