/**
 * Direct Postgres connection helper.
 *
 * PostgREST (the @supabase/supabase-js .from() API) can't see the `storage`
 * schema, and gets throttled before raw Postgres does when an org is over
 * quota. For maintenance jobs that need to enumerate storage.objects or
 * delete in bulk, we connect via the Supavisor transaction pooler instead.
 *
 * Requires SUPABASE_DB_PASSWORD env var.
 */
import { Client } from "pg";

const REGION = process.env.SUPABASE_REGION || "eu-central-1";

export function makePgClient(): Client {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL not set");
  if (!password) throw new Error("SUPABASE_DB_PASSWORD not set");

  const ref = new URL(url).hostname.split(".")[0];
  const connectionString = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-1-${REGION}.pooler.supabase.com:6543/postgres`;
  return new Client({ connectionString });
}
