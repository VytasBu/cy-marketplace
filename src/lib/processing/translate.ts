/**
 * Translation using the free Google Translate endpoint.
 * No API key required. Falls back gracefully if unavailable.
 */
export async function translateToEnglish(
  text: string
): Promise<{ translated: string; detectedLanguage: string } | null> {
  if (!text.trim()) return null;

  // If text is already primarily English, skip translation
  if (isLikelyEnglish(text)) {
    return { translated: text, detectedLanguage: "en" };
  }

  try {
    const url = new URL(
      "https://translate.googleapis.com/translate_a/single"
    );
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", "auto");
    url.searchParams.set("tl", "en");
    url.searchParams.set("dt", "t");
    url.searchParams.set("q", text);

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      console.error("Translation error:", response.status);
      return null;
    }

    const data = await response.json();

    // Response format: [[["translated text","original text",null,null,confidence],...], null, "detected_lang"]
    if (!Array.isArray(data) || !Array.isArray(data[0])) {
      return null;
    }

    const translatedParts: string[] = [];
    for (const part of data[0]) {
      if (Array.isArray(part) && typeof part[0] === "string") {
        translatedParts.push(part[0]);
      }
    }

    const translated = translatedParts.join("");
    const detectedLanguage =
      typeof data[2] === "string" ? data[2] : "unknown";

    if (!translated.trim()) return null;

    return { translated, detectedLanguage };
  } catch (error) {
    console.error("Translation error:", error);
    return null;
  }
}

/**
 * Check if text is likely already English.
 * If ANY Cyrillic characters are present, always translate — brand names
 * like "iPhone 13 Pro" inflate the Latin ratio in mixed Russian-English text.
 */
function isLikelyEnglish(text: string): boolean {
  const words = text.replace(/[^a-zA-Zа-яА-ЯёЁ\s]/g, "").trim();
  if (!words) return true;
  // If any Cyrillic characters exist, always translate
  const hasCyrillic = /[а-яА-ЯёЁ]/.test(words);
  if (hasCyrillic) return false;
  return true;
}
