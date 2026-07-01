/**
 * Email delivery via Resend.
 *
 * Resend's free tier (100/day, 3k/mo) is enough for this app's saved-search
 * notifications. The `onboarding@resend.dev` sender works with no domain
 * verification — good enough for personal notifications. When we outgrow
 * it, swap FROM to a verified custom domain.
 */
import { Resend } from "resend";

const FROM = process.env.RESEND_FROM || "CY Marketplace <onboarding@resend.dev>";

let client: Resend | null = null;
function getClient(): Resend {
  if (client) return client;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  client = new Resend(key);
  return client;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ error?: string }> {
  try {
    const res = await getClient().emails.send({ from: FROM, to, subject, html });
    if (res.error) return { error: res.error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
