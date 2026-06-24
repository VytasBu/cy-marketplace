import { Client } from "pg";

async function main() {
  const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0];
  const pg = new Client({
    connectionString: `postgresql://postgres.${ref}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD!)}@aws-1-eu-central-1.pooler.supabase.com:6543/postgres`,
  });
  await pg.connect();

  const { rows: [counts] } = await pg.query(`
    select
      (select count(*) from listings) as listings,
      (select count(*) from listings where photos is not null and array_length(photos,1) > 0) as listings_with_photos,
      (select count(*) from storage.objects where bucket_id='listing-photos') as objects,
      (select pg_size_pretty(coalesce(sum((metadata->>'size')::bigint),0)) from storage.objects where bucket_id='listing-photos') as size
  `);
  console.log("Counts:", counts);

  const { rows: sample } = await pg.query(`
    select photos[1] as url from listings
    where photos is not null and array_length(photos,1) > 0
    order by created_at desc limit 3
  `);
  console.log("Sample listing URLs:", sample);

  const { rows: storageSample } = await pg.query(`
    select name from storage.objects where bucket_id='listing-photos' limit 5
  `);
  console.log("Sample storage names:", storageSample);

  await pg.end();
}

main().catch(e => { console.error(e); process.exit(1); });
