/**
 * Rewind vytas@outframe.co's saved searches so there are new matches,
 * then trigger the notify pipeline.
 *   npx tsx --env-file=.env.local scripts/test-notify.ts
 */
import { makePgClient } from "../src/lib/supabase/pg";
import { runNotifications } from "../src/lib/saved-searches";

async function main() {
  const pg = makePgClient();
  await pg.connect();

  const { rows: users } = await pg.query<{ id: string; email: string }>(
    "select id, email from auth.users where email = 'vytas@outframe.co'"
  );
  if (users.length === 0) {
    console.error("No auth.users row for vytas@outframe.co");
    process.exit(1);
  }
  const userId = users[0].id;
  console.log(`Found user ${userId}`);

  const { rows: searches } = await pg.query(
    "select id, name, filters, last_notified_at, notify_enabled from saved_searches where user_id = $1",
    [userId]
  );
  if (searches.length === 0) {
    console.error("No saved searches for this user");
    process.exit(1);
  }
  console.log("Saved searches:");
  for (const s of searches) console.log("  ", s);

  const rewind = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString();
  console.log(`\nRewinding last_notified_at to ${rewind}...`);
  const upd = await pg.query(
    "update saved_searches set last_notified_at = $1, notify_enabled = true where user_id = $2",
    [rewind, userId]
  );
  console.log(`Updated ${upd.rowCount} rows`);

  await pg.end();

  console.log("\nRunning notify pass...");
  const result = await runNotifications();
  console.log(result);
}

main().catch(e => { console.error(e); process.exit(1); });
