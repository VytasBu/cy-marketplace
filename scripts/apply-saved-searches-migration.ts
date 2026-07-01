/**
 * One-shot: apply the saved_searches migration to the remote DB.
 *   npx tsx --env-file=.env.local scripts/apply-saved-searches-migration.ts
 */
import { readFileSync } from "fs";
import { makePgClient } from "../src/lib/supabase/pg";

async function main() {
  const sql = readFileSync(
    "supabase/migrations/20260701000000_saved_searches.sql",
    "utf-8"
  );
  const pg = makePgClient();
  await pg.connect();
  await pg.query(sql);
  console.log("✓ saved_searches migration applied");
  await pg.end();
}

main().catch(e => { console.error(e); process.exit(1); });
