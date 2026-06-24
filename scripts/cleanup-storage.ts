/**
 * One-shot cleanup: delete orphan storage objects + photos belonging to
 * listings older than 30 days, then delete the old listing rows.
 *
 * Uses direct Postgres (via the Supavisor pooler) for queries — PostgREST
 * is blocked while the org is over quota — and the Storage API for deletes.
 *
 * Run from project root:
 *   npx tsx --env-file=.env.local scripts/cleanup-storage.ts
 *
 * Safe to re-run — it's idempotent.
 */
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
if (!url || !serviceKey || !dbPassword) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_PASSWORD");
  process.exit(1);
}

// Extract project ref from https://<ref>.supabase.co
const ref = new URL(url).hostname.split(".")[0];
// Pooler hostname — region inferred from the project (eu-central-1 per dashboard).
// If wrong, the connection will fail fast and we can swap regions.
const REGION = process.env.SUPABASE_REGION || "eu-central-1";
const dbUrl = `postgresql://postgres.${ref}:${encodeURIComponent(dbPassword)}@aws-1-${REGION}.pooler.supabase.com:6543/postgres`;

const supabase = createClient(url, serviceKey);
const BUCKET = "listing-photos";
const CHUNK = 900;

function pathFromUrl(u: string): string | null {
  const m = u.match(/\/listing-photos\/(.+)$/);
  return m ? m[1] : null;
}

async function listAllObjects(): Promise<string[]> {
  const names: string[] = [];
  let offset = 0;
  const PAGE = 1000;
  for (;;) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list("", { limit: PAGE, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const item of data) names.push(item.name);
    if (data.length < PAGE) break;
    offset += PAGE;
    process.stdout.write(`\r  listed ${names.length} objects...`);
  }
  process.stdout.write("\n");
  return names;
}

async function removeInChunks(paths: string[], label: string): Promise<number> {
  let deleted = 0;
  for (let i = 0; i < paths.length; i += CHUNK) {
    const chunk = paths.slice(i, i + CHUNK);
    const { error } = await supabase.storage.from(BUCKET).remove(chunk);
    if (error) {
      console.error(`\n  ${label} chunk ${i / CHUNK}: ${error.message}`);
    } else {
      deleted += chunk.length;
    }
    process.stdout.write(`\r  ${label}: ${deleted}/${paths.length}`);
  }
  process.stdout.write("\n");
  return deleted;
}

async function main() {
  console.log(`→ Connecting to Postgres pooler (region: ${REGION})...`);
  const pg = new Client({ connectionString: dbUrl });
  await pg.connect();
  console.log("  connected.");

  console.log("→ Pulling referenced photo paths from listings...");
  const refRes = await pg.query<{ url: string }>(
    "select unnest(photos) as url from listings where photos is not null"
  );
  const referenced = new Set<string>();
  for (const row of refRes.rows) {
    const p = pathFromUrl(row.url);
    if (p) referenced.add(p);
  }
  console.log(`  ${referenced.size} unique paths referenced`);

  console.log("→ Listing all storage objects...");
  const allNames = await listAllObjects();
  console.log(`  ${allNames.length} objects in bucket`);

  const orphans = allNames.filter((n) => !referenced.has(n));
  console.log(`→ Deleting ${orphans.length} orphan objects...`);
  const orphansDeleted = await removeInChunks(orphans, "orphans");

  console.log("→ Finding old listings (>30d)...");
  const oldRes = await pg.query<{ id: string; photos: string[] | null }>(
    "select id, photos from listings where raw_date < now() - interval '30 days'"
  );
  const oldIds = oldRes.rows.map((r) => r.id);
  const oldPaths: string[] = [];
  for (const row of oldRes.rows) {
    if (Array.isArray(row.photos)) {
      for (const u of row.photos) {
        const p = pathFromUrl(u);
        if (p) oldPaths.push(p);
      }
    }
  }
  console.log(`  ${oldIds.length} old listings, ${oldPaths.length} photos to delete`);

  const oldPhotosDeleted = await removeInChunks(oldPaths, "old photos");

  console.log("→ Deleting old listing rows...");
  let rowsDeleted = 0;
  for (let i = 0; i < oldIds.length; i += 500) {
    const chunk = oldIds.slice(i, i + 500);
    const res = await pg.query("delete from listings where id = any($1::uuid[])", [chunk]);
    rowsDeleted += res.rowCount ?? 0;
    process.stdout.write(`\r  rows: ${rowsDeleted}/${oldIds.length}`);
  }
  process.stdout.write("\n");

  await pg.end();

  console.log("\n✓ Done");
  console.log(`  Orphans deleted:    ${orphansDeleted}`);
  console.log(`  Old photos deleted: ${oldPhotosDeleted}`);
  console.log(`  Old rows deleted:   ${rowsDeleted}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
