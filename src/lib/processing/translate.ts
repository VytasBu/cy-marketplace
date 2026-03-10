/**
 * Google Cloud Translation API v2
 * Free: 500k chars/month (never expires)
 * Then: $20/M characters
 */
export async function translateToEnglish(
  text: string
): Promise<{ translated: string; detectedLanguage: string } | null> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_TRANSLATE_API_KEY not set, skipping translation");
    return null;
  }

  if (!text.trim()) return null;

  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          target: "en",
          format: "text",
        }),
      }
    );

    if (!response.ok) {
      console.error("Translation API error:", response.status);
      return null;
    }

    const data = await response.json();
    const translation = data.data?.translations?.[0];

    if (!translation) return null;

    return {
      translated: translation.translatedText,
      detectedLanguage: translation.detectedSourceLanguage || "unknown",
    };
  } catch (error) {
    console.error("Translation error:", error);
    return null;
  }
}
