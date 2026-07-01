/**
 * Saved-search notification engine.
 *
 * For each active saved search, find listings created after `last_notified_at`
 * that match the search's filters, and email a digest to the search owner.
 *
 * The filter set mirrors /api/listings, but the query is built in raw SQL
 * against the pooler because we're running from a cron context and want to
 * bypass any PostgREST rate-limiting weirdness.
 */
import { makePgClient } from "@/lib/supabase/pg";
import { sendEmail } from "@/lib/email";

interface SavedSearchFilters {
  search?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  location?: string;
  datePosted?: string; // "today" | "week" | "all" — we only apply to guard old data
}

interface SavedSearchRow {
  id: string;
  user_id: string;
  name: string;
  filters: SavedSearchFilters;
  last_notified_at: Date;
  unsubscribe_token: string;
}

interface MatchListing {
  id: string;
  description_original: string | null;
  description_en: string | null;
  price: number | null;
  currency: string | null;
  location: string | null;
  created_at: Date;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cy-marketplace.vercel.app";
const MAX_PER_EMAIL = 20;

/**
 * Build a SQL WHERE fragment for a saved search's filters.
 * Params start at $startIdx and grow. Returns SQL text + the ordered params.
 */
function buildWhere(
  filters: SavedSearchFilters,
  startIdx: number
): { sql: string; params: (string | number)[] } {
  const parts: string[] = [
    "is_duplicate = false",
    "photos is not null and array_length(photos, 1) > 0",
    "coalesce(telegram_sender_username, '') <> 'cyprus_faqbot'",
  ];
  const params: (string | number)[] = [];
  let i = startIdx;

  if (filters.search) {
    parts.push(
      `(coalesce(description_en, '') ilike $${i} or coalesce(description_original, '') ilike $${i})`
    );
    params.push(`%${filters.search}%`);
    i += 1;
  }
  if (filters.priceMin !== undefined) {
    parts.push(`price >= $${i}`);
    params.push(filters.priceMin);
    i += 1;
  }
  if (filters.priceMax !== undefined) {
    parts.push(`price <= $${i}`);
    params.push(filters.priceMax);
    i += 1;
  }
  if (filters.location) {
    parts.push(`coalesce(location, '') ilike $${i}`);
    params.push(`%${filters.location}%`);
    i += 1;
  }

  return { sql: parts.join(" and "), params };
}

/**
 * Resolve a category slug to that category + all its descendant IDs.
 */
async function resolveCategoryIds(
  pg: import("pg").Client,
  slug: string
): Promise<number[]> {
  const { rows } = await pg.query<{ id: number }>(
    `with recursive tree as (
       select id from categories where slug = $1
       union all
       select c.id from categories c join tree t on c.parent_id = t.id
     )
     select id from tree`,
    [slug]
  );
  return rows.map((r) => r.id);
}

/**
 * Match one saved search against new listings, return the matches.
 */
async function findMatches(
  pg: import("pg").Client,
  search: SavedSearchRow
): Promise<MatchListing[]> {
  const params: (string | number)[] = [];
  const parts: string[] = [];

  // Category filter (resolve slug → ids first).
  if (search.filters.category) {
    const ids = await resolveCategoryIds(pg, search.filters.category);
    if (ids.length === 0) return []; // unknown slug ⇒ no matches
    params.push(ids as unknown as string);
    parts.push(`category_id = any($${params.length}::int[])`);
  }

  // Other filters.
  const where = buildWhere(search.filters, params.length + 1);
  parts.push(where.sql);
  params.push(...where.params);

  // Only listings that appeared since the last notification.
  parts.push(`created_at > $${params.length + 1}`);
  params.push(search.last_notified_at.toISOString());

  const sql = `
    select id, description_original, description_en, price, currency,
           location, created_at
    from listings
    where ${parts.join(" and ")}
    order by created_at desc
    limit ${MAX_PER_EMAIL + 1}
  `;

  const res = await pg.query<MatchListing>(sql, params);
  return res.rows;
}

function summarize(filters: SavedSearchFilters): string {
  const parts: string[] = [];
  if (filters.search) parts.push(`"${filters.search}"`);
  if (filters.category) parts.push(filters.category);
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    const min = filters.priceMin !== undefined ? `€${filters.priceMin}` : "";
    const max = filters.priceMax !== undefined ? `€${filters.priceMax}` : "";
    parts.push(`${min}${min && max ? " – " : ""}${max}`);
  }
  if (filters.location) parts.push(filters.location);
  return parts.join(" · ") || "any listing";
}

function renderDigest(
  searchName: string,
  filterSummary: string,
  matches: MatchListing[],
  overflow: boolean,
  searchUrl: string,
  unsubscribeUrl: string
): { subject: string; html: string; text: string } {
  const subject = `${matches.length}${overflow ? "+" : ""} new match${matches.length === 1 ? "" : "es"} for "${searchName}"`;

  const items = matches
    .slice(0, MAX_PER_EMAIL)
    .map((l) => {
      const priceStr = l.price != null ? `€${l.price}` : "no price";
      const raw = l.description_en || l.description_original || "";
      const title = raw.split("\n")[0].slice(0, 100) || "(no description)";
      const loc = l.location ? ` · ${l.location}` : "";
      return `<li style="margin-bottom:12px;">
        <a href="${SITE_URL}/listing/${l.id}" style="color:#0066cc;text-decoration:none;font-weight:500;">${escapeHtml(title)}</a>
        <div style="color:#666;font-size:13px;margin-top:2px;">${priceStr}${escapeHtml(loc)}</div>
      </li>`;
    })
    .join("");

  const overflowNote = overflow
    ? `<p style="color:#888;font-size:13px;margin-top:16px;">+ more waiting. <a href="${searchUrl}">See all →</a></p>`
    : "";

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px;">
    <h2 style="margin:0 0 4px;font-size:18px;">${escapeHtml(searchName)}</h2>
    <p style="color:#666;margin:0 0 20px;font-size:13px;">${escapeHtml(filterSummary)}</p>
    <ul style="list-style:none;padding:0;margin:0;">${items}</ul>
    ${overflowNote}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="color:#999;font-size:12px;">
      CY Marketplace saved-search notification.
      <br>
      <a href="${unsubscribeUrl}" style="color:#999;">Unsubscribe from this search</a>
    </p>
  </div>`;

  const textLines = [
    `${searchName} — ${matches.length}${overflow ? "+" : ""} new match${matches.length === 1 ? "" : "es"}`,
    filterSummary,
    "",
    ...matches.slice(0, MAX_PER_EMAIL).map((l) => {
      const priceStr = l.price != null ? `€${l.price}` : "no price";
      const raw = l.description_en || l.description_original || "";
      const title = raw.split("\n")[0].slice(0, 100) || "(no description)";
      const loc = l.location ? ` — ${l.location}` : "";
      return `• ${title}\n  ${priceStr}${loc}\n  ${SITE_URL}/listing/${l.id}`;
    }),
    "",
    overflow ? `More matches waiting: ${searchUrl}` : "",
    "",
    `Unsubscribe: ${unsubscribeUrl}`,
  ].filter(Boolean);

  return { subject, html, text: textLines.join("\n") };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildSearchUrl(filters: SavedSearchFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.priceMin !== undefined) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax !== undefined) params.set("priceMax", String(filters.priceMax));
  if (filters.location) params.set("location", filters.location);
  const q = params.toString();
  return q ? `${SITE_URL}/?${q}` : SITE_URL;
}

export interface NotifyResult {
  searchesChecked: number;
  emailsSent: number;
  matchesFound: number;
  errors: string[];
}

/**
 * Run notification pass across every active saved search.
 * Meant to be called from the /api/scrape cron after new listings land.
 */
export async function runNotifications(): Promise<NotifyResult> {
  const result: NotifyResult = {
    searchesChecked: 0,
    emailsSent: 0,
    matchesFound: 0,
    errors: [],
  };

  const pg = makePgClient();
  await pg.connect();

  try {
    const { rows: searches } = await pg.query<SavedSearchRow>(`
      select id, user_id, name, filters, last_notified_at, unsubscribe_token
      from saved_searches
      where notify_enabled = true
    `);

    for (const search of searches) {
      result.searchesChecked += 1;

      let matches: MatchListing[];
      try {
        matches = await findMatches(pg, search);
      } catch (e) {
        result.errors.push(`match(${search.id}): ${e instanceof Error ? e.message : String(e)}`);
        continue;
      }

      if (matches.length === 0) continue;

      const overflow = matches.length > MAX_PER_EMAIL;
      result.matchesFound += matches.length;

      // Get email from auth.users.
      const emailRes = await pg.query<{ email: string | null }>(
        "select email from auth.users where id = $1",
        [search.user_id]
      );
      const email = emailRes.rows[0]?.email;
      if (!email) {
        result.errors.push(`no email for user ${search.user_id}`);
        continue;
      }

      const unsubscribeUrl = `${SITE_URL}/api/unsubscribe?token=${search.unsubscribe_token}`;
      const { subject, html, text } = renderDigest(
        search.name,
        summarize(search.filters),
        matches,
        overflow,
        buildSearchUrl(search.filters),
        unsubscribeUrl
      );

      const send = await sendEmail({
        to: email,
        subject,
        html,
        text,
        headers: {
          // RFC 2369 + 8058: gives Gmail's "Unsubscribe" chip a real target,
          // signals to spam filters that this is legit notification email.
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
      if (send.error) {
        result.errors.push(`send(${search.id}): ${send.error}`);
        continue;
      }

      // Only advance the cursor if the email actually succeeded.
      await pg.query(
        "update saved_searches set last_notified_at = now() where id = $1",
        [search.id]
      );
      result.emailsSent += 1;
    }
  } finally {
    await pg.end();
  }

  return result;
}
