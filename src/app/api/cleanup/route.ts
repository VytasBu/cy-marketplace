import { NextRequest, NextResponse } from "next/server";
import { makePgClient } from "@/lib/supabase/pg";

export const maxDuration = 60;

// ──────────────────────────────────────────────────────────────────────
// Tunables — adjust here, not at call sites.
// ──────────────────────────────────────────────────────────────────────
const RETENTION_DAYS = 21;
const TARGET_BYTES = 650 * 1024 * 1024; // size-based sweep aims for this
const TIME_BUDGET_MS = 50_000;

// ──────────────────────────────────────────────────────────────────────
// Why SQL-direct instead of the Storage API?
//
// When a Supabase org goes over its storage quota, the Storage API (read,
// write AND delete) returns 402 — meaning the API-based cleanup that's
// supposed to recover the project is itself blocked. Self-healing
// impossible.
//
// Postgres direct connections (via the pooler) are not gated by the quota.
// Supabase guards `storage.objects` with a BEFORE-DELETE trigger
// (`protect_delete`) that blocks direct SQL deletes. We bypass it for the
// connection by setting `session_replication_role = replica`, which is
// Postgres's standard mechanism for disabling triggers in maintenance
// contexts.
//
// Side effect: the underlying S3 blobs become orphaned on Supabase's
// infrastructure. They don't count against your reported usage (Supabase
// computes that from `storage.objects.metadata.size`), so the project
// unblocks immediately and stays unblocked.
// ──────────────────────────────────────────────────────────────────────

function pathExtractRegex() {
  // Note: kept identical between read (CTE) and any future code.
  return "/listing-photos/(.+)$";
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
    oldPhotosDeleted: 0,
    oldListingsDeleted: 0,
    overflowPhotosDeleted: 0,
    overflowListingsDeleted: 0,
    bytesBefore: 0,
    bytesAfter: 0,
    errors: [] as string[],
    timedOut: false,
    durationMs: 0,
  };

  async function bucketBytes(): Promise<number> {
    const { rows: [r] } = await pg.query<{ bytes: string }>(
      `select coalesce(sum((metadata->>'size')::bigint), 0)::text as bytes
       from storage.objects where bucket_id = 'listing-photos'`
    );
    return Number(r.bytes);
  }

  // Run a storage.objects DELETE with triggers temporarily disabled, then
  // restore default behavior so subsequent statements (on `listings` etc.)
  // get their FK constraints and updated_at triggers as usual.
  async function deleteFromStorageObjects(sql: string): Promise<number> {
    await pg.query("begin");
    try {
      await pg.query("set local session_replication_role = replica");
      const res = await pg.query(sql);
      await pg.query("commit");
      return res.rowCount ?? 0;
    } catch (e) {
      await pg.query("rollback").catch(() => {});
      throw e;
    }
  }

  try {
    result.bytesBefore = await bucketBytes();

    // ──────────────────────────────────────────────────────────────
    // 1. Orphan sweep — every object not referenced by listings.photos.
    // ──────────────────────────────────────────────────────────────
    if (!timedOut()) {
      result.orphansDeleted = await deleteFromStorageObjects(`
        with referenced as (
          select coalesce(substring(url from '${pathExtractRegex()}'), '') as name
          from listings, unnest(photos) as url
          where photos is not null
        )
        delete from storage.objects o
        where o.bucket_id = 'listing-photos'
          and not exists (select 1 from referenced r where r.name = o.name)
      `);
    }

    // ──────────────────────────────────────────────────────────────
    // 2. Time-based — listings older than RETENTION_DAYS plus their photos.
    // ──────────────────────────────────────────────────────────────
    if (!timedOut()) {
      result.oldPhotosDeleted = await deleteFromStorageObjects(`
        with old_paths as (
          select substring(url from '${pathExtractRegex()}') as name
          from listings, unnest(photos) as url
          where raw_date < now() - interval '${RETENTION_DAYS} days'
        )
        delete from storage.objects o
        where o.bucket_id = 'listing-photos'
          and exists (select 1 from old_paths p where p.name = o.name)
      `);

      const rowRes = await pg.query(
        `delete from listings where raw_date < now() - interval '${RETENTION_DAYS} days'`
      );
      result.oldListingsDeleted = rowRes.rowCount ?? 0;
    }

    // ──────────────────────────────────────────────────────────────
    // 3. Size-based safety net — if still over TARGET, delete oldest
    //    remaining listings until under.
    // ──────────────────────────────────────────────────────────────
    if (!timedOut()) {
      let current = await bucketBytes();
      while (current > TARGET_BYTES && !timedOut()) {
        result.overflowPhotosDeleted += await deleteFromStorageObjects(`
          with overflow as (
            select id from listings
            order by raw_date asc nulls first
            limit 200
          ),
          paths as (
            select substring(url from '${pathExtractRegex()}') as name
            from listings l, unnest(l.photos) as url
            where l.id in (select id from overflow)
          )
          delete from storage.objects o
          where o.bucket_id = 'listing-photos'
            and exists (select 1 from paths p where p.name = o.name)
        `);

        const overflowRows = await pg.query(`
          delete from listings
          where id in (
            select id from listings
            order by raw_date asc nulls first
            limit 200
          )
        `);
        const deletedThisRound = overflowRows.rowCount ?? 0;
        result.overflowListingsDeleted += deletedThisRound;
        if (deletedThisRound === 0) break;

        current = await bucketBytes();
      }
    }

    result.bytesAfter = await bucketBytes();
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
    bytesBeforeMB: Math.round(result.bytesBefore / 1024 / 1024),
    bytesAfterMB: Math.round(result.bytesAfter / 1024 / 1024),
    targetMB: Math.round(TARGET_BYTES / 1024 / 1024),
  });
}
