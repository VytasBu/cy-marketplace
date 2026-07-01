import { NextRequest } from "next/server";
import { makePgClient } from "@/lib/supabase/pg";

export const dynamic = "force-dynamic";

function html(body: string): Response {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>Unsubscribed</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
         max-width: 480px; margin: 80px auto; padding: 24px; color: #222;
         text-align: center; }
  h1 { font-size: 20px; margin-bottom: 8px; }
  p { color: #666; }
  a { color: #0066cc; text-decoration: none; }
</style></head><body>${body}</body></html>`,
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

async function unsubscribe(token: string): Promise<string> {
  const pg = makePgClient();
  try {
    await pg.connect();
    const res = await pg.query<{ name: string }>(
      `update saved_searches
       set notify_enabled = false
       where unsubscribe_token = $1
       returning name`,
      [token]
    );
    if (res.rowCount === 0) return "not_found";
    return res.rows[0].name;
  } finally {
    await pg.end().catch(() => {});
  }
}

/**
 * Gmail's "one-click unsubscribe" sends POST (RFC 8058).
 * Regular email-client links use GET.
 */
async function handle(request: NextRequest): Promise<Response> {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return html(`<h1>Missing token</h1><p>This link isn't valid.</p>`);
  }
  const result = await unsubscribe(token);
  if (result === "not_found") {
    return html(`<h1>Not found</h1><p>This link may have expired.</p>`);
  }
  return html(
    `<h1>Unsubscribed</h1>
     <p>You won't get more emails for <strong>${escapeHtml(result)}</strong>.</p>
     <p><a href="/">Back to CY Marketplace</a></p>`
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const GET = handle;
export const POST = handle;
