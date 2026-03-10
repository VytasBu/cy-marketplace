import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

let clientInstance: TelegramClient | null = null;

export async function getTelegramClient(): Promise<TelegramClient> {
  if (clientInstance?.connected) {
    return clientInstance;
  }

  const apiId = parseInt(process.env.TELEGRAM_API_ID || "0");
  const apiHash = process.env.TELEGRAM_API_HASH || "";
  const sessionString = process.env.TELEGRAM_SESSION_STRING || "";

  if (!apiId || !apiHash || !sessionString) {
    throw new Error("Missing Telegram credentials in env vars");
  }

  const session = new StringSession(sessionString);
  clientInstance = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });

  await clientInstance.connect();
  return clientInstance;
}

export async function disconnectTelegram() {
  if (clientInstance) {
    await clientInstance.disconnect();
    clientInstance = null;
  }
}
