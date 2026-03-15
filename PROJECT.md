# CY Marketplace — Project Documentation

> Cyprus Buy & Sell marketplace that scrapes Telegram channels, processes listings with AI, and serves them through a modern Next.js frontend.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (Google OAuth + Email OTP) |
| Storage | Supabase Storage (listing photos) |
| Hosting | Vercel (Hobby plan) |
| AI | Anthropic Claude Haiku (categorization) |
| Telegram | `telegram` npm package (GramJS) |
| Translation | Google Translate (free endpoint) |
| Image processing | Sharp (800px max, 70% quality JPEG) |
| UI | shadcn/ui, Tailwind CSS 4, Embla Carousel, cmdk |

## External Services & Cron Jobs

| Service | Purpose | Schedule |
|---------|---------|----------|
| **cron-job.org** | Triggers `/api/scrape` | Every 6 minutes |
| **Vercel Cron** | `/api/scrape` fallback | Daily 08:00 UTC |
| **Vercel Cron** | `/api/cleanup` | Daily 03:00 UTC |

> Vercel Hobby plan only supports daily crons. The real scraping frequency comes from cron-job.org hitting the endpoint every 6 minutes.

All cron endpoints require `Authorization: Bearer {CRON_SECRET}`.

## Scraper Architecture (`src/lib/telegram/scraper.ts`)

- Fetches messages from configured Telegram channel in **batches of 50**
- Loops batches within a **55-second time budget** (Vercel function limit is 60s)
- Saves bookmark (`last_scraped_message_id`) after each batch so progress survives timeouts
- Filters out bot messages (e.g. `cyprus_faqbot`, `chatkeeperbot`)
- Groups album messages (multiple photos for one listing)
- Supports `forward` (new posts) and `backward` (historical) directions

## Processing Pipeline (`src/lib/processing/pipeline.ts`)

Each scraped message goes through:

1. **Translation** (`translate.ts`) — Google Translate free endpoint, auto-detect → English. Skips if already English.
2. **Price extraction** (`price.ts`) — See [Price Extraction Rules](#price-extraction-rules) below.
3. **Location extraction** (`location.ts`) — Matches 10 Cyprus cities with English/Russian/Greek aliases.
4. **Categorization** (`categorize.ts`) — Primary: Claude Haiku LLM. Fallback: keyword matching. Default: "Other" (id=12).
5. **Duplicate detection** (`deduplicate.ts`) — MD5 hash of normalized text + fuzzy Jaccard similarity (threshold 0.7) for same-sender messages.
6. **Insert/Update** — New listings inserted; duplicates marked with `is_duplicate=true, duplicate_of=<original_id>`.

## Database Schema

### Key Tables

- **`categories`** — 3-level hierarchy (parent_id chain). Fields: name, name_ru, slug, icon, keywords[], sort_order.
- **`listings`** — Main data. telegram_message_id (unique per channel), description_original, description_en, price, currency, location, category_id, photos[], content_hash, is_duplicate.
- **`telegram_channels`** — Channel config with `last_scraped_message_id` bookmark.
- **`profiles`** — Auto-created on signup via DB trigger. Linked to `auth.users`.
- **`saved_listings`** — User favorites (user_id + listing_id unique).
- **`saved_searches`** — Named filter presets stored as JSONB.

RLS enabled: categories/listings are public-read; user data is per-user.

## API Endpoints

### Public
| Endpoint | Description |
|----------|-------------|
| `GET /api/listings` | Paginated listings with filters (search, category, price, location, date, sort) |
| `GET /api/listings/[id]` | Single listing with category path |
| `GET /api/categories` | All categories sorted by order |

### Protected (Bearer token)
| Endpoint | Description |
|----------|-------------|
| `GET /api/scrape` | Telegram scraper. Params: `direction`, `offsetId` |
| `GET /api/cleanup` | Delete listings > 30 days, remove photos from storage |
| `GET /api/reprocess-backfill` | Re-translate + re-extract prices. Params: `offset`, `limit`, `dryRun` |
| `GET /api/recategorize` | Re-categorize with LLM. Params: `force`, `offset`, `limit` |
| `GET /api/translate-backfill` | Fill missing English translations |
| `GET /api/health` | System health: last scrape time, storage, translation backlog |

## Frontend Architecture

### Layout (`src/components/layout/`)
- **`marketplace-layout.tsx`** — 3-column grid: filters sidebar | feed | detail panel
- **`header.tsx`** — Top nav with user menu
- **`feed.tsx`** — Grid of listing cards with infinite scroll, context header (search query or category breadcrumb with back button)
- **`filters-sidebar.tsx`** / **`filters-drawer.tsx`** — Desktop sidebar / mobile drawer
- **`detail-panel.tsx`** — Selected listing details

### Search (`src/components/filters/search-input.tsx`)
- cmdk Command component as dropdown
- **Empty input:** shows recent searches from localStorage (max 3, with X to remove)
- **Typing:** top item "Search for {query}" + category suggestions matching name/keywords
- **Enter:** triggers text search, saves to recents
- **Category click:** sets category filter (clears search), atomic via `setFilters()`

### Filters (`src/lib/hooks/use-filters.ts`)
- All filter state lives in URL search params
- `setFilter()` for single param, `setFilters()` for atomic multi-param updates
- Changing any filter resets page to 1

### Listings API Hook (`src/lib/hooks/use-listings.ts`)
- Client-side data fetching with URL params as dependencies
- Supports infinite scroll via `loadMore()` / `hasMore`

## Key File Locations

```
src/
  app/
    api/scrape/route.ts        # Telegram scraper endpoint
    api/listings/route.ts      # Listings query endpoint
    api/cleanup/route.ts       # Old listing cleanup
    api/health/route.ts        # Health monitoring
    page.tsx                   # Home page
    saved/page.tsx             # Saved listings page
  lib/
    telegram/scraper.ts        # Scraper with batch looping
    telegram/client.ts         # Telegram client singleton
    telegram/media.ts          # Photo download & upload
    processing/pipeline.ts     # Main processing orchestrator
    processing/price.ts        # Price regex extraction
    processing/categorize.ts   # LLM + keyword categorization
    processing/translate.ts    # Google Translate
    processing/location.ts     # Cyprus city matching
    processing/deduplicate.ts  # Hash + fuzzy dedup
    hooks/use-filters.ts       # URL-based filter state
    hooks/use-listings.ts      # Listings data fetching
    supabase/client.ts         # Browser Supabase client
    supabase/server.ts         # Server Supabase client (service role)
  components/
    layout/feed.tsx            # Main listing grid
    filters/search-input.tsx   # Command bar search
    listing/listing-card.tsx   # Grid card with carousel
    listing/listing-detail.tsx # Full listing view
    auth/login-dialog.tsx      # Auth modal
vercel.json                    # Cron config
supabase/migrations/           # DB migration files
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Telegram
TELEGRAM_API_ID=
TELEGRAM_API_HASH=
TELEGRAM_SESSION_STRING=
TELEGRAM_CHANNEL_USERNAME=

# AI & Translation
ANTHROPIC_API_KEY=
GOOGLE_TRANSLATE_API_KEY=       # Optional, uses free endpoint

# Security
CRON_SECRET=                    # Bearer token for cron endpoints
```

## Price Extraction Rules

**File:** `src/lib/processing/price.ts`

### Supported Currencies
EUR (€, EUR, евро, euros), USD ($, USD, доллар), GBP (£), RUB (₽, руб, р)

### Pattern Priority
1. **Contextual matches** — "цена: 500€", "price: €500", "стоимость 500€" (highest confidence)
2. **Positive selling context** — "продам за 500€", "selling for 500€", "asking 500€"
3. **Clean matches** — "500€" without negative context
4. **Fallback** — first price found regardless of context

### Number Format Handling
| Input | Interpreted As | Rule |
|-------|---------------|------|
| `7.000€` | €7,000 | Dot + exactly 3 digits = thousands separator |
| `1.234.567€` | €1,234,567 | Multiple dot-thousands groups |
| `7.000,50€` | €7,000.50 | Dot = thousands, comma = decimal |
| `54,000€` | €54,000 | Comma + exactly 3 digits = thousands separator |
| `54,50€` | €54.50 | Comma + 1-2 digits = decimal separator |
| `7.50€` | €7.50 | Dot + 1-2 digits = decimal separator |

### Validation
- Amount must be **≥ 5** and **< 10,000,000** (filters out model numbers like "iPhone 12")
- Only spaces/tabs allowed between number and currency symbol (not newlines, prevents cross-line false matches)
- Negative context filtered: "was", "paid", "retail price", "старая цена", "покупала" etc.
- Separator characters (comma, dot, space) in numbers must be followed by a digit (prevents "3150, 20€" → "3150, 20")

### Pipeline Integration
- Price extracted from **original text first**, falls back to **translated English text**
- Stored as `price` (numeric) + `currency` (text, default 'EUR') in the `listings` table

## Known Limitations

- **Vercel Hobby cron:** Limited to daily schedules. Real-time scraping relies on cron-job.org.
- **Vercel function timeout:** 60s max. Scraper uses 55s time budget with per-batch bookmarking.
- **Supabase OAuth consent screen:** Shows ugly `*.supabase.co` subdomain. Fixing requires Supabase Pro plan ($25/mo) custom domain.
- **Google Translate:** Uses free endpoint, may have rate limits or reliability issues. 300ms delay between requests.
- **LLM categorization:** 200ms rate limit between Anthropic API calls. Costs per request.
