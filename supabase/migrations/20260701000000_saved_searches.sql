-- Add notification tracking columns to the existing saved_searches table.
-- The table itself was created earlier in the app's evolution; this migration
-- only adds the fields the notification cron needs.

alter table saved_searches
  add column if not exists last_notified_at timestamptz not null default now();

alter table saved_searches
  add column if not exists notify_enabled boolean not null default true;
