import { NextRequest, NextResponse } from "next/server";
import { makePgClient } from "@/lib/supabase/pg";
import { r2BucketBytes, r2DeleteMany, r2KeyFromUrl, r2ListAll } from "@/lib/r2";

export const maxDuration = 60;

// ──────────────────────────────────────────────────────────────────────
// Tunables — R2 has 10 GB free; we're targeting ~280 MB steady state
// after WebP. Set generous cushions.
// ──────────────────────────────────────────────────────────────────────
const RETENTION_DAYS = 21;
const TARGET_BYTES = 1024 * 1024 * 1024; // 1 GB target, well under R2's 10 GB free
const TIME_BUDGET_MS = 50_000;

/** Extract the object key from a legacy Supabase URL, if it is one. */
function supabasePathFromUrl(url: string): string | null {
  const m = url.match(/\/listing-photos\/(.+)$/);
  return m ? m[1] : null;
}

/**
 * Delete photos referenced by a set of listing URLs. Handles both R2
 * (current) and Supabase (legacy) URLs — Supabase deletes go through
 * SQL bypass because the Storage API is restricted.
 */
async function deletePhotosByUrls(
  pg: import("pg").Client,
  urls: string[]
): Promise<{ r2: number; supabase: number }> {
  const r2Keys: string[] = [];
  const supabasePaths: string[] = [];

  for (const url of urls) {
    const rKey = r2KeyFromUrl(url);
    if (rKey) {
      r2Keys.push(rKey);
      continue;
    }
    const sPath = supabasePathFromUrl(url);
    if (sPath) supabasePaths.push(sPath);
  }

  const r2Deleted = await r2DeleteMany(r2Keys);

  let supabaseDeleted = 0;
  if (supabasePaths.length > 0) {
    await pg.query("begin");
    try {
      await pg.query("set local session_replication_role = replica");
      const res = await pg.query(
        `delete from storage.objects
         where bucket_id = 'listing-photos'
           and name = any($1::text[])`,
        [supabasePaths]
      );
      await pg.query("commit");
      supabaseDeleted = res.rowCount ?? 0;
    } catch (e) {
      await pg.query("rollback").catch(() => {});
      throw e;
    }
  }

  return { r2: r2Deleted, supabase: supabaseDeleted };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start = Date.now();
  const timedOut = () => Date.now() - start > TIME_BUDGET_MS;

  const pg = makePgClient();
  await pg.connect();

  const result = {
    orphansDeleted: 0,
    oldR2Deleted: 0,
    oldSupabaseDeleted: 0,
    oldListingsDeleted: 0,
    overflowR2Deleted: 0,
    overflowSupabaseDeleted: 0,
    overflowListingsDeleted: 0,
    r2BytesBefore: 0,
    r2BytesAfter: 0,
    errors: [] as string[],
    timedOut: false,
    durationMs: 0,
  };

  try {
    result.r2BytesBefore = await r2BucketBytes();

    // ──────────────────────────────────────────────────────────────
    // 1. R2 orphan sweep — any R2 object not referenced by a listing.
    // ──────────────────────────────────────────────────────────────
    if (!timedOut()) {
      const refRes = await pg.query<{ url: string }>(
        "select unnest(photos) as url from listings where photos is not null"
      );
      const referencedR2Keys = new Set<string>();
      for (const r of refRes.rows) {
        const k = r2KeyFromUrl(r.url);
        if (k) referencedR2Keys.add(k);
      }
      const allR2 = await r2ListAll();
      const orphans = allR2
        .map((o) => o.key)
        .filter((k) => !referencedR2Keys.has(k));
      result.orphansDeleted = await r2DeleteMany(orphans);
    }

    // ──────────────────────────────────────────────────────────────
    // 2. Time-based — listings older than RETENTION_DAYS + their photos.
    // ──────────────────────────────────────────────────────────────
    if (!timedOut()) {
      const oldRes = await pg.query<{ id: string; photos: string[] | null }>(
        `select id, photos from listings
         where raw_date < now() - interval '${RETENTION_DAYS} days'`
      );

      const urls: string[] = [];
      for (const row of oldRes.rows) {
        if (Array.isArray(row.photos)) urls.push(...row.photos);
      }
      const del = await deletePhotosByUrls(pg, urls);
      result.oldR2Deleted = del.r2;
      result.oldSupabaseDeleted = del.supabase;

      if (oldRes.rows.length > 0 && !timedOut()) {
        const ids = oldRes.rows.map((r) => r.id);
        for (let i = 0; i < ids.length; i += 500) {
          const chunk = ids.slice(i, i + 500);
          const res = await pg.query(
            "delete from listings where id = any($1::uuid[])",
            [chunk]
          );
          result.oldListingsDeleted += res.rowCount ?? 0;
        }
      }
    }

    // ──────────────────────────────────────────────────────────────
    // 3. Size safety net — R2 measured only. Delete oldest remaining
    //    listings until R2 is under TARGET_BYTES.
    // ──────────────────────────────────────────────────────────────
    if (!timedOut()) {
      let current = await r2BucketBytes();
      while (current > TARGET_BYTES && !timedOut()) {
        const { rows } = await pg.query<{ id: string; photos: string[] | null }>(
          `select id, photos from listings
           order by raw_date asc nulls first
           limit 200`
        );
        if (rows.length === 0) break;

        const urls: string[] = [];
        for (const row of rows) {
          if (Array.isArray(row.photos)) urls.push(...row.photos);
        }
        const del = await deletePhotosByUrls(pg, urls);
        result.overflowR2Deleted += del.r2;
        result.overflowSupabaseDeleted += del.supabase;

        const ids = rows.map((r) => r.id);
        const delRes = await pg.query(
          "delete from listings where id = any($1::uuid[])",
          [ids]
        );
        const deletedThisRound = delRes.rowCount ?? 0;
        result.overflowListingsDeleted += deletedThisRound;
        if (deletedThisRound === 0) break;

        current = await r2BucketBytes();
      }
    }

    result.r2BytesAfter = await r2BucketBytes();
  } catch (e) {
    result.errors.push(`fatal: ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    await pg.end();
    result.timedOut = timedOut();
    result.durationMs = Date.now() - start;
  }

  return NextResponse.json({
    success: result.errors.length === 0,
    ...result,
    r2BytesBeforeMB: Math.round(result.r2BytesBefore / 1024 / 1024),
    r2BytesAfterMB: Math.round(result.r2BytesAfter / 1024 / 1024),
    targetMB: Math.round(TARGET_BYTES / 1024 / 1024),
  });
}
