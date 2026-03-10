-- CY Marketplace Schema

-- Categories (hierarchical, 3 levels)
create table categories (
  id serial primary key,
  name text not null,
  name_ru text,
  slug text unique not null,
  icon text,
  parent_id int references categories(id) on delete cascade,
  level int not null default 0,
  keywords text[] default '{}',
  sort_order int default 0
);

create index idx_categories_parent on categories(parent_id);
create index idx_categories_slug on categories(slug);

-- Listings
create table listings (
  id uuid primary key default gen_random_uuid(),
  telegram_message_id bigint not null,
  telegram_channel text not null,
  telegram_sender_id bigint,
  telegram_sender_name text,
  telegram_sender_username text,
  description_original text,
  description_en text,
  price numeric,
  currency text default 'EUR',
  location text,
  category_id int references categories(id) on delete set null,
  categorization_method text,
  content_hash text,
  is_duplicate boolean default false,
  duplicate_of uuid references listings(id) on delete set null,
  photos text[] default '{}',
  raw_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(telegram_channel, telegram_message_id)
);

create index idx_listings_category on listings(category_id);
create index idx_listings_price on listings(price);
create index idx_listings_created on listings(created_at desc);
create index idx_listings_hash on listings(content_hash);
create index idx_listings_not_dup on listings(is_duplicate) where not is_duplicate;
create index idx_listings_location on listings(location);
create index idx_listings_search on listings using gin(to_tsvector('english', coalesce(description_en, '') || ' ' || coalesce(description_original, '')));

-- Telegram channels config
create table telegram_channels (
  id serial primary key,
  username text unique not null,
  title text,
  last_scraped_message_id bigint default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- RLS policies (public read, service role write)
alter table categories enable row level security;
alter table listings enable row level security;
alter table telegram_channels enable row level security;

create policy "Categories are viewable by everyone"
  on categories for select using (true);

create policy "Listings are viewable by everyone"
  on listings for select using (true);

create policy "Telegram channels are viewable by everyone"
  on telegram_channels for select using (true);
