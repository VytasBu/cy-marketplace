import { makePgClient } from "../src/lib/supabase/pg";

async function main() {
  const pg = makePgClient();
  await pg.connect();
  const cols = await pg.query(`
    select column_name, data_type, is_nullable, column_default
    from information_schema.columns
    where table_name = 'saved_searches' and table_schema = 'public'
    order by ordinal_position
  `);
  console.log("Columns:", cols.rows);
  const rows = await pg.query("select * from saved_searches limit 10");
  console.log("Rows:", rows.rows);
  await pg.end();
}

main().catch(e => { console.error(e); process.exit(1); });
