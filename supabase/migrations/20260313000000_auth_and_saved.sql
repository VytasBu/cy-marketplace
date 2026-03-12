-- Auth & Saved Features Schema

-- profiles (auto-created on signup via trigger)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- saved_listings (favorites)
create table saved_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, listing_id)
);
create index idx_saved_listings_user on saved_listings(user_id);

-- saved_searches (named filter combos)
create table saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  filters jsonb not null,
  created_at timestamptz default now()
);
create index idx_saved_searches_user on saved_searches(user_id);

-- RLS
alter table profiles enable row level security;
alter table saved_listings enable row level security;
alter table saved_searches enable row level security;

-- profiles: users can read/update their own
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- saved_listings: users CRUD their own
create policy "Users can view own saved listings" on saved_listings for select using (auth.uid() = user_id);
create policy "Users can save listings" on saved_listings for insert with check (auth.uid() = user_id);
create policy "Users can unsave listings" on saved_listings for delete using (auth.uid() = user_id);

-- saved_searches: users CRUD their own
create policy "Users can view own saved searches" on saved_searches for select using (auth.uid() = user_id);
create policy "Users can save searches" on saved_searches for insert with check (auth.uid() = user_id);
create policy "Users can delete saved searches" on saved_searches for delete using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
