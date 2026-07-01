-- Per-saved-search token used in unsubscribe URLs.
alter table saved_searches
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

create index if not exists idx_saved_searches_unsub_token
  on saved_searches (unsubscribe_token);
