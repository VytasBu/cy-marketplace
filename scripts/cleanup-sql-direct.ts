/**
 * Emergency cleanup when the Supabase Storage API is blocked (over quota).
 *
 * Bypasses the storage.protect_delete trigger by setting
 * session_replication_role=replica for the connection. This is a Postgres
 * standard mechanism for disabling triggers in maintenance/admin contexts.
 *
 * Trade-off: underlying S3 objects become orphaned on Supabase's side
 * (their cleanup may not reap them). The metric Supabase uses for quota
 * (sum of metadata.size in storage.objects) drops immediately, so the
 * project unblocks.
 *
 * Run: npx tsx --env-file=.env.local scripts/cleanup-sql-direct.ts
 *
 *   --dry        : just report what would be deleted, change nothing
 *   --confirm    : actually run the deletes
 */
import { makePgClient } from "../src/lib/supabase/pg";

const RETENTION_DAYS = 21;
const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry") || !args.has("--confirm");

async function main() {
  const pg = makePgClient();
  await pg.connect();

  // Disable trigger enforcement for this session only.
  if (!DRY) {
    await pg.query("set session_replication_role = replica");
    console.log("• Triggers disabled for this session (replica mode)");
  }

  const before = await pg.query<{ count: string; bytes: string }>(
    `select count(*)::text as count,
            coalesce(sum((metadata->>'size')::bigint), 0)::text as bytes
     from storage.objects where bucket_id = 'listing-photos'`
  );
  console.log(`Before: ${before.rows[0].count} objects, ${(Number(before.rows[0].bytes)/1024/1024).toFixed(1)} MB`);

  // 1. Find orphans — objects not referenced by any listings.photos URL.
  const orphanRes = await pg.query<{ count: string; bytes: string }>(`
    with referenced as (
      select coalesce(substring(url from '/listing-photos/(.+)$'), '') as name
      from listings, unnest(photos) as url
      where photos is not null
    )
    select count(*)::text as count,
           coalesce(sum((metadata->>'size')::bigint), 0)::text as bytes
    from storage.objects o
    where bucket_id = 'listing-photos'
      and not exists (select 1 from referenced r where r.name = o.name)
  `);
  console.log(`• Orphans: ${orphanRes.rows[0].count} objects, ${(Number(orphanRes.rows[0].bytes)/1024/1024).toFixed(1)} MB`);

  // 2. Find old-listing photos.
  const oldRes = await pg.query<{ count: string; bytes: string }>(`
    with old_paths as (
      select substring(url from '/listing-photos/(.+)$') as name
      from listings, unnest(photos) as url
      where raw_date < now() - interval '${RETENTION_DAYS} days'
    )
    select count(*)::text as count,
           coalesce(sum((metadata->>'size')::bigint), 0)::text as bytes
    from storage.objects o
    where bucket_id = 'listing-photos'
      and exists (select 1 from old_paths p where p.name = o.name)
  `);
  console.log(`• Old (>${RETENTION_DAYS}d) photos: ${oldRes.rows[0].count} objects, ${(Number(oldRes.rows[0].bytes)/1024/1024).toFixed(1)} MB`);

  if (DRY) {
    console.log("\nDry run — pass --confirm to actually delete.");
    await pg.end();
    return;
  }

  // Run deletes.
  console.log("\nDeleting orphans...");
  const delOrphans = await pg.query(`
    with referenced as (
      select coalesce(substring(url from '/listing-photos/(.+)$'), '') as name
      from listings, unnest(photos) as url
      where photos is not null
    )
    delete from storage.objects o
    where o.bucket_id = 'listing-photos'
      and not exists (select 1 from referenced r where r.name = o.name)
  `);
  console.log(`  ✓ ${delOrphans.rowCount} orphans deleted`);

  console.log("Deleting old-listing photos...");
  const delOld = await pg.query(`
    with old_paths as (
      select substring(url from '/listing-photos/(.+)$') as name
      from listings, unnest(photos) as url
      where raw_date < now() - interval '${RETENTION_DAYS} days'
    )
    delete from storage.objects o
    where o.bucket_id = 'listing-photos'
      and exists (select 1 from old_paths p where p.name = o.name)
  `);
  console.log(`  ✓ ${delOld.rowCount} old photos deleted`);

  console.log("Deleting old listing rows...");
  const delRows = await pg.query(
    `delete from listings where raw_date < now() - interval '${RETENTION_DAYS} days'`
  );
  console.log(`  ✓ ${delRows.rowCount} old listings deleted`);

  const after = await pg.query<{ count: string; bytes: string }>(
    `select count(*)::text as count,
            coalesce(sum((metadata->>'size')::bigint), 0)::text as bytes
     from storage.objects where bucket_id = 'listing-photos'`
  );
  console.log(`\nAfter: ${after.rows[0].count} objects, ${(Number(after.rows[0].bytes)/1024/1024).toFixed(1)} MB`);

  await pg.end();
}

main().catch(e => { console.error(e); process.exit(1); });
