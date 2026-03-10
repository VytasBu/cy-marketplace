/**
 * One-time Telegram authentication script.
 * Run with: npx tsx src/scripts/telegram-auth.ts
 *
 * This will prompt you for your phone number, send an SMS code,
 * and output a StringSession to save in your .env.local file.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function main() {
  const apiId = parseInt(process.env.TELEGRAM_API_ID || "");
  const apiHash = process.env.TELEGRAM_API_HASH || "";

  if (!apiId || !apiHash) {
    console.error("Missing TELEGRAM_API_ID or TELEGRAM_API_HASH in env.");
    console.error("Get these from https://my.telegram.org/apps");
    process.exit(1);
  }

  const session = new StringSession("");
  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: () => prompt("Enter your phone number (with country code): "),
    password: () => prompt("Enter your 2FA password (if set): "),
    phoneCode: () => prompt("Enter the code you received: "),
    onError: (err) => console.error("Auth error:", err),
  });

  console.log("\n✅ Authentication successful!");
  console.log("\nYour session string (save this in TELEGRAM_SESSION_STRING):\n");
  console.log(client.session.save());
  console.log("\n");

  await client.disconnect();
  rl.close();
}

main().catch(console.error);
