import { readFileSync } from "fs";
import { makePgClient } from "../src/lib/supabase/pg";

async function main() {
  const sql = readFileSync(
    "supabase/migrations/20260701010000_unsubscribe_token.sql",
    "utf-8"
  );
  const pg = makePgClient();
  await pg.connect();
  await pg.query(sql);
  console.log("✓ unsubscribe_token migration applied");
  await pg.end();
}

main().catch(e => { console.error(e); process.exit(1); });
