/**
 * Proper orphan cleanup. Enumerates every storage object via Postgres
 * (since Supabase list() only returns folder prefixes at the root),
 * diffs against listings.photos, deletes via Storage API.
 *
 *   npx tsx --env-file=.env.local scripts/cleanup-orphans.ts
 */
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const ref = new URL(url).hostname.split(".")[0];
  const pg = new Client({
    connectionString: `postgresql://postgres.${ref}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD!)}@aws-1-eu-central-1.pooler.supabase.com:6543/postgres`,
  });
  await pg.connect();

  const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  console.log("→ Pulling referenced paths from listings.photos...");
  const refRes = await pg.query<{ url: string }>(
    "select unnest(photos) as url from listings where photos is not null"
  );
  const referenced = new Set<string>();
  for (const r of refRes.rows) {
    const m = r.url.match(/\/listing-photos\/(.+)$/);
    if (m) referenced.add(m[1]);
  }
  console.log(`  ${referenced.size} referenced paths`);

  console.log("→ Pulling every object name from storage.objects...");
  const objRes = await pg.query<{ name: string }>(
    "select name from storage.objects where bucket_id='listing-photos'"
  );
  console.log(`  ${objRes.rows.length} objects total`);

  const orphans = objRes.rows.map(r => r.name).filter(n => !referenced.has(n));
  console.log(`→ ${orphans.length} orphans to delete`);

  let deleted = 0;
  const CHUNK = 900;
  for (let i = 0; i < orphans.length; i += CHUNK) {
    const chunk = orphans.slice(i, i + CHUNK);
    const { error } = await supabase.storage.from("listing-photos").remove(chunk);
    if (error) console.error(`\n  chunk ${i / CHUNK}: ${error.message}`);
    else deleted += chunk.length;
    process.stdout.write(`\r  ${deleted}/${orphans.length}`);
  }
  process.stdout.write("\n");

  await pg.end();
  console.log(`\n✓ Deleted ${deleted} orphan objects`);
}

main().catch(e => { console.error(e); process.exit(1); });
