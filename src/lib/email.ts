/**
 * Email delivery via Resend.
 *
 * Free tier (100/day, 3k/mo) sends from onboarding@resend.dev, which only
 * delivers reliably to the Resend account owner and lands in spam
 * elsewhere. Verifying a custom domain in Resend and setting RESEND_FROM
 * to `notifications@<yourdomain>` unlocks any-recipient delivery with
 * good inbox placement.
 */
import { Resend } from "resend";

const FROM =
  process.env.RESEND_FROM || "CY Marketplace Alerts <onboarding@resend.dev>";

let client: Resend | null = null;
function getClient(): Resend {
  if (client) return client;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  client = new Resend(key);
  return client;
}

interface SendOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
}

export async function sendEmail(
  opts: SendOptions
): Promise<{ error?: string }> {
  try {
    const res = await getClient().emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      headers: opts.headers,
    });
    if (res.error) return { error: res.error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
