import { makePgClient } from "../src/lib/supabase/pg";

async function main() {
  const pg = makePgClient();
  await pg.connect();

  const mp = await pg.query(`
    select count(*) as count,
           coalesce(sum((metadata->>'size')::bigint), 0) as bytes
    from storage.s3_multipart_uploads
  `);
  console.log("s3_multipart_uploads:", mp.rows[0]);

  const parts = await pg.query(`
    select count(*) as count,
           coalesce(sum(size::bigint), 0) as bytes,
           pg_size_pretty(coalesce(sum(size::bigint), 0)) as pretty
    from storage.s3_multipart_uploads_parts
  `);
  console.log("s3_multipart_uploads_parts:", parts.rows[0]);

  const analytics = await pg.query(`select * from storage.buckets_analytics limit 5`);
  console.log("buckets_analytics sample:", analytics.rows);

  await pg.end();
}

main().catch(e => { console.error(e); process.exit(1); });
