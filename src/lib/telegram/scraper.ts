import { Api } from "telegram/tl";
import { getTelegramClient, disconnectTelegram } from "./client";
import { downloadAndUploadPhotos } from "./media";
import { processListing } from "@/lib/processing/pipeline";
import { createServiceClient } from "@/lib/supabase/server";

interface RawMessage {
  messageId: number;
  text: string;
  senderId: number | null;
  senderName: string | null;
  senderUsername: string | null;
  date: Date;
  photos: string[];
}

export async function scrapeChannel(
  direction: "forward" | "backward" = "forward",
  offsetId?: number
): Promise<{
  processed: number;
  errors: number;
  oldestId: number | null;
}> {
  const supabase = createServiceClient();
  const channelUsername = process.env.TELEGRAM_CHANNEL_USERNAME;

  if (!channelUsername) {
    throw new Error("TELEGRAM_CHANNEL_USERNAME not set");
  }

  // Get last scraped message ID
  const { data: channelData } = await supabase
    .from("telegram_channels")
    .select("last_scraped_message_id")
    .eq("username", channelUsername)
    .single();

  const lastMessageId = channelData?.last_scraped_message_id || 0;

  // Ensure channel record exists
  if (!channelData) {
    await supabase.from("telegram_channels").upsert(
      {
        username: channelUsername,
        last_scraped_message_id: 0,
        is_active: true,
      },
      { onConflict: "username" }
    );
  }

  const client = await getTelegramClient();
  let processed = 0;
  let errors = 0;
  let maxMessageId = lastMessageId;
  let minMessageId: number | null = null;

  try {
    // 3 messages every 6 minutes via cron-job.org (30/hour covers peak ~17/hr)
    const FETCH_LIMIT = 3;

    // Bots to ignore
    const IGNORED_USERNAMES = ["chatkeeperbot"];
    const messages: Api.Message[] = [];

    if (direction === "forward") {
      // Forward: fetch messages NEWER than lastMessageId
      for await (const message of client.iterMessages(channelUsername, {
        minId: lastMessageId,
        limit: FETCH_LIMIT,
      })) {
        if (message instanceof Api.Message && message.message) {
          messages.push(message);
        }
      }
    } else {
      // Backward: fetch messages OLDER than offsetId
      // GramJS iterMessages with offsetId returns messages with ID < offsetId
      const iterOpts: { limit: number; offsetId?: number } = {
        limit: FETCH_LIMIT,
      };
      if (offsetId) {
        iterOpts.offsetId = offsetId;
      }
      for await (const message of client.iterMessages(
        channelUsername,
        iterOpts
      )) {
        if (message instanceof Api.Message && message.message) {
          messages.push(message);
        }
      }
    }

    // Filter out bot messages (still track their IDs for bookmark)
    const filteredMessages: Api.Message[] = [];
    for (const msg of messages) {
      let isBot = false;
      if (msg.fromId) {
        try {
          const sender = await client.getEntity(msg.fromId);
          if (sender instanceof Api.User && sender.username) {
            isBot = IGNORED_USERNAMES.includes(sender.username.toLowerCase());
          }
        } catch {
          // Can't resolve sender, keep the message
        }
      }
      if (!isBot) {
        filteredMessages.push(msg);
      }
    }

    // Process in chronological order (oldest first)
    // Use original messages for ID tracking, filtered for processing
    messages.reverse();
    filteredMessages.reverse();

    // Track min/max IDs (from ALL messages, including bots, for bookmark)
    for (const msg of messages) {
      if (msg.id > maxMessageId) maxMessageId = msg.id;
      if (minMessageId === null || msg.id < minMessageId)
        minMessageId = msg.id;
    }

    // Group filtered messages by groupedId for album handling
    const groupedMessages = new Map<string, Api.Message[]>();
    const standaloneMessages: Api.Message[] = [];

    for (const msg of filteredMessages) {
      if (msg.groupedId) {
        const groupKey = msg.groupedId.toString();
        if (!groupedMessages.has(groupKey)) {
          groupedMessages.set(groupKey, []);
        }
        groupedMessages.get(groupKey)!.push(msg);
      } else {
        standaloneMessages.push(msg);
      }
    }

    // Small delay helper to be gentle on the API
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // Process standalone messages
    for (const msg of standaloneMessages) {
      try {
        const raw = await extractMessage(client, msg, channelUsername);
        if (raw) {
          await processListing(raw, channelUsername);
          processed++;
        }
        await sleep(500); // gentle rate limiting
      } catch (err) {
        console.error(`Error processing message ${msg.id}:`, err);
        errors++;
      }
    }

    // Process grouped messages (albums)
    for (const [, group] of groupedMessages) {
      try {
        const raw = await extractGroupedMessages(
          client,
          group,
          channelUsername
        );
        if (raw) {
          await processListing(raw, channelUsername);
          processed++;
        }
        await sleep(500); // gentle rate limiting
      } catch (err) {
        console.error(`Error processing grouped messages:`, err);
        errors++;
      }
    }

    // Update last scraped message ID (forward bookmark)
    if (maxMessageId > lastMessageId) {
      await supabase
        .from("telegram_channels")
        .update({ last_scraped_message_id: maxMessageId })
        .eq("username", channelUsername);
    }
  } finally {
    await disconnectTelegram();
  }

  return { processed, errors, oldestId: minMessageId };
}

async function extractMessage(
  client: Awaited<ReturnType<typeof getTelegramClient>>,
  msg: Api.Message,
  channelUsername: string
): Promise<RawMessage | null> {
  if (!msg.message?.trim()) return null;

  // Generate a temporary ID for photo uploads
  const tempId = `${channelUsername}-${msg.id}`;

  // Download and upload photos
  const photos = await downloadAndUploadPhotos(client, msg, tempId);

  // Get sender info
  let senderId: number | null = null;
  let senderName: string | null = null;
  let senderUsername: string | null = null;

  if (msg.fromId) {
    try {
      const sender = await client.getEntity(msg.fromId);
      if (sender instanceof Api.User) {
        senderId = sender.id.toJSNumber();
        senderName = [sender.firstName, sender.lastName]
          .filter(Boolean)
          .join(" ");
        senderUsername = sender.username || null;
      }
    } catch {
      // Sender info unavailable (e.g., channel post without author)
    }
  }

  return {
    messageId: msg.id,
    text: msg.message,
    senderId,
    senderName,
    senderUsername,
    date: new Date(msg.date * 1000),
    photos,
  };
}

async function extractGroupedMessages(
  client: Awaited<ReturnType<typeof getTelegramClient>>,
  group: Api.Message[],
  channelUsername: string
): Promise<RawMessage | null> {
  // Use the first message with text as the main message
  const mainMsg = group.find((m) => m.message?.trim()) || group[0];
  if (!mainMsg.message?.trim()) return null;

  const tempId = `${channelUsername}-${mainMsg.id}`;

  // Collect photos from all messages in the group
  const allPhotos: string[] = [];
  for (let i = 0; i < group.length; i++) {
    const msg = group[i];
    const photos = await downloadAndUploadPhotos(
      client,
      msg,
      `${tempId}-${i}`
    );
    allPhotos.push(...photos);
  }

  // Get sender info from main message
  let senderId: number | null = null;
  let senderName: string | null = null;
  let senderUsername: string | null = null;

  if (mainMsg.fromId) {
    try {
      const sender = await client.getEntity(mainMsg.fromId);
      if (sender instanceof Api.User) {
        senderId = sender.id.toJSNumber();
        senderName = [sender.firstName, sender.lastName]
          .filter(Boolean)
          .join(" ");
        senderUsername = sender.username || null;
      }
    } catch {
      // Sender info unavailable
    }
  }

  return {
    messageId: mainMsg.id,
    text: mainMsg.message,
    senderId,
    senderName,
    senderUsername,
    date: new Date(mainMsg.date * 1000),
    photos: allPhotos,
  };
}
