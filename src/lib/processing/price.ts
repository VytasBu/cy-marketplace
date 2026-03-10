interface PriceResult {
  amount: number;
  currency: string;
}

/**
 * Patterns ordered by priority:
 * 1. "number €" (most common in European/Russian markets)
 * 2. "€number" (less common)
 * 3. Explicit price context ("цена", "price", "стоимость")
 *
 * Key rules:
 * - Between symbol and number, only allow spaces (NOT newlines)
 * - Amount must be >= 5 to avoid matching model numbers (e.g., "iPhone 12")
 * - Prefer the first match that looks like a real price
 */
const PRICE_PATTERNS: Array<{
  regex: RegExp;
  currency: string;
  amountGroup: number;
}> = [
  // === EUR — "number €" first (most common in RU/EU) ===
  { regex: /(\d[\d\s,.]*)\s*€/, currency: "EUR", amountGroup: 1 },
  { regex: /(\d[\d\s,.]*)\s*EUR\b/i, currency: "EUR", amountGroup: 1 },
  { regex: /(\d[\d\s,.]*)\s*евро/i, currency: "EUR", amountGroup: 1 },
  // "€ number" — only allow spaces (no newlines) between symbol and digits
  { regex: /€[ \t]*(\d[\d\s,.]*)/, currency: "EUR", amountGroup: 1 },
  { regex: /EUR[ \t]*(\d[\d\s,.]*)/i, currency: "EUR", amountGroup: 1 },

  // === USD ===
  { regex: /(\d[\d\s,.]*)\s*\$/, currency: "USD", amountGroup: 1 },
  { regex: /(\d[\d\s,.]*)\s*USD\b/i, currency: "USD", amountGroup: 1 },
  {
    regex: /(\d[\d\s,.]*)\s*доллар(?:ов|а|ы)?/i,
    currency: "USD",
    amountGroup: 1,
  },
  { regex: /\$[ \t]*(\d[\d\s,.]*)/, currency: "USD", amountGroup: 1 },
  { regex: /USD[ \t]*(\d[\d\s,.]*)/i, currency: "USD", amountGroup: 1 },

  // === GBP ===
  { regex: /(\d[\d\s,.]*)\s*£/, currency: "GBP", amountGroup: 1 },
  { regex: /£[ \t]*(\d[\d\s,.]*)/, currency: "GBP", amountGroup: 1 },

  // === RUB ===
  { regex: /(\d[\d\s,.]*)\s*₽/, currency: "RUB", amountGroup: 1 },
  {
    regex: /(\d[\d\s,.]*)\s*руб(?:лей|ля|ль|\.)?/i,
    currency: "RUB",
    amountGroup: 1,
  },
  { regex: /(\d[\d\s,.]*)\s*р\b/i, currency: "RUB", amountGroup: 1 },
];

/**
 * Contextual patterns — if text contains "цена" / "price" / "стоимость"
 * followed by a number, prefer that match.
 */
const CONTEXT_PATTERNS: Array<{
  regex: RegExp;
  currency: string;
  amountGroup: number;
}> = [
  {
    regex: /(?:цена|price|стоимость)[:\s\-–—]*(\d[\d\s,.]*)\s*€/i,
    currency: "EUR",
    amountGroup: 1,
  },
  {
    regex: /(?:цена|price|стоимость)[:\s\-–—]*€?\s*(\d[\d\s,.]*)/i,
    currency: "EUR",
    amountGroup: 1,
  },
];

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".");
  const amount = parseFloat(cleaned);
  // Must be a reasonable marketplace price (>= 5, < 10M)
  if (!isNaN(amount) && amount >= 5 && amount < 10_000_000) {
    return amount;
  }
  return null;
}

export function extractPrice(text: string): PriceResult | null {
  // First try contextual patterns (highest confidence)
  for (const { regex, currency, amountGroup } of CONTEXT_PATTERNS) {
    const match = text.match(regex);
    if (match) {
      const amount = parseAmount(match[amountGroup]);
      if (amount !== null) {
        return { amount, currency };
      }
    }
  }

  // Then try standard patterns
  for (const { regex, currency, amountGroup } of PRICE_PATTERNS) {
    const match = text.match(regex);
    if (match) {
      const amount = parseAmount(match[amountGroup]);
      if (amount !== null) {
        return { amount, currency };
      }
    }
  }

  return null;
}
