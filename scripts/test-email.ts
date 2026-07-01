/**
 * Fire one test email through Resend to verify the pipeline works.
 *   npx tsx --env-file=.env.local scripts/test-email.ts
 */
import { sendEmail } from "../src/lib/email";

async function main() {
  const to = process.argv[2] || "vytas@outframe.co";
  console.log(`→ Sending test email to ${to}...`);
  const res = await sendEmail(
    to,
    "CY Marketplace — email pipeline test",
    `<div style="font-family:sans-serif;padding:20px;">
      <h2 style="margin:0 0 12px;">✅ Resend is working</h2>
      <p>If you're reading this, your saved-search notification pipeline is wired up correctly.</p>
      <p style="color:#666;font-size:13px;">Sent from a manual test at ${new Date().toISOString()}.</p>
    </div>`
  );
  if (res.error) {
    console.error("✗ Failed:", res.error);
    process.exit(1);
  }
  console.log("✓ Sent. Check your inbox.");
}

main();
