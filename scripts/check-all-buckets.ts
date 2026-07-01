import { makePgClient } from "../src/lib/supabase/pg";

async function main() {
  const pg = makePgClient();
  await pg.connect();
  const { rows } = await pg.query(`
    select bucket_id,
           count(*) as objects,
           pg_size_pretty(coalesce(sum((metadata->>'size')::bigint), 0)) as size
    from storage.objects
    group by bucket_id
    order by 3 desc
  `);
  console.log("Buckets:", rows);

  const total = await pg.query(`
    select pg_size_pretty(coalesce(sum((metadata->>'size')::bigint), 0)) as total
    from storage.objects
  `);
  console.log("Total across all buckets:", total.rows[0]);
  await pg.end();
}

main().catch(e => { console.error(e); process.exit(1); });
