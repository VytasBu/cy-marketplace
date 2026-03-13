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
  // Use [ \t] (not \s) between digits to avoid matching across newlines
  // e.g. "высота 40\n20€" should NOT become "4020€"
  { regex: /(\d[\d ,.]*\d)[ \t]*€/, currency: "EUR", amountGroup: 1 },
  { regex: /(\d[\d ,.]*\d)[ \t]*EUR\b/i, currency: "EUR", amountGroup: 1 },
  { regex: /(\d[\d ,.]*\d)[ \t]*евро/i, currency: "EUR", amountGroup: 1 },
  { regex: /(\d[\d ,.]*\d)[ \t]*euros?\b/i, currency: "EUR", amountGroup: 1 },
  // Single digit before currency
  { regex: /(\d)[ \t]*€/, currency: "EUR", amountGroup: 1 },
  { regex: /(\d)[ \t]*EUR\b/i, currency: "EUR", amountGroup: 1 },
  { regex: /(\d)[ \t]*евро/i, currency: "EUR", amountGroup: 1 },
  { regex: /(\d)[ \t]*euros?\b/i, currency: "EUR", amountGroup: 1 },
  // "€ number" — only allow spaces (no newlines) between symbol and digits
  { regex: /€[ \t]*(\d[\d ,.]*)/, currency: "EUR", amountGroup: 1 },
  { regex: /EUR[ \t]*(\d[\d ,.]*)/i, currency: "EUR", amountGroup: 1 },

  // === USD ===
  { regex: /(\d[\d ,.]*\d)[ \t]*\$/, currency: "USD", amountGroup: 1 },
  { regex: /(\d[\d ,.]*\d)[ \t]*USD\b/i, currency: "USD", amountGroup: 1 },
  {
    regex: /(\d[\d ,.]*\d)[ \t]*доллар(?:ов|а|ы)?/i,
    currency: "USD",
    amountGroup: 1,
  },
  { regex: /(\d[\d ,.]*\d)[ \t]*dollars?\b/i, currency: "USD", amountGroup: 1 },
  // Single digit before currency
  { regex: /(\d)[ \t]*\$/, currency: "USD", amountGroup: 1 },
  { regex: /(\d)[ \t]*USD\b/i, currency: "USD", amountGroup: 1 },
  {
    regex: /(\d)[ \t]*доллар(?:ов|а|ы)?/i,
    currency: "USD",
    amountGroup: 1,
  },
  { regex: /\$[ \t]*(\d[\d ,.]*)/, currency: "USD", amountGroup: 1 },
  { regex: /USD[ \t]*(\d[\d ,.]*)/i, currency: "USD", amountGroup: 1 },

  // === GBP ===
  { regex: /(\d[\d ,.]*\d)[ \t]*£/, currency: "GBP", amountGroup: 1 },
  { regex: /(\d)[ \t]*£/, currency: "GBP", amountGroup: 1 },
  { regex: /£[ \t]*(\d[\d ,.]*)/, currency: "GBP", amountGroup: 1 },

  // === RUB ===
  { regex: /(\d[\d ,.]*\d)[ \t]*₽/, currency: "RUB", amountGroup: 1 },
  { regex: /(\d)[ \t]*₽/, currency: "RUB", amountGroup: 1 },
  {
    regex: /(\d[\d ,.]*\d)[ \t]*руб(?:лей|ля|ль|\.)?/i,
    currency: "RUB",
    amountGroup: 1,
  },
  {
    regex: /(\d)[ \t]*руб(?:лей|ля|ль|\.)?/i,
    currency: "RUB",
    amountGroup: 1,
  },
  { regex: /(\d[\d ,.]*\d)[ \t]*р\b/i, currency: "RUB", amountGroup: 1 },
  { regex: /(\d)[ \t]*р\b/i, currency: "RUB", amountGroup: 1 },
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
    regex: /(?:цена|price|стоимость)[:\s\-–—]*(\d[\d ,.]*)[ \t]*€/i,
    currency: "EUR",
    amountGroup: 1,
  },
  {
    regex: /(?:цена|price|стоимость)[:\s\-–—]*€?[ \t]*(\d[\d ,.]*)/i,
    currency: "EUR",
    amountGroup: 1,
  },
];

/**
 * Negative context — text on the same line before a price that indicates
 * it's NOT the selling price. Only checks back to the nearest newline.
 */
const NEGATIVE_CONTEXT =
  /(?:original(?:ly)?|was|were|used to (?:cost|be)|retail(?:\s+price)?|rrp|msrp|old price|former(?:ly)?|previously|bought (?:for|at)|paid|cost (?:me|with|us)|новая? стоила?|старая цена|было|стоила?|стоил[аио]?\b|раньше|покупала?|магазинн(?:ая|ой) цен[аеы]|в магазине|закупочн|(?:starts?|начина[ея]тся) (?:from|от)|altogether[\s\d]*new)/i;

/**
 * Positive selling-price context — if present immediately before the price,
 * this IS the asking/selling price. Checked against the same-line context.
 */
const POSITIVE_CONTEXT =
  /(?:selling (?:for|at)?|asking|now|продам\s*(?:за)?|отда[мю]\s*(?:за)?|прошу|(?<!\w)цена|(?<!\w)стоимость)[ \t:]*$/i;

function parseAmount(raw: string): number | null {
  // Remove whitespace
  let cleaned = raw.replace(/\s/g, "");
  // Determine if comma is a thousands separator or decimal separator:
  // "54,000" → thousands (3 digits after comma) → remove comma
  // "54,50" or "54,5" → decimal → replace with dot
  if (/,\d{3}(?!\d)/.test(cleaned)) {
    // Thousands separator — remove all commas
    cleaned = cleaned.replace(/,/g, "");
  } else {
    // Decimal separator — replace comma with dot
    cleaned = cleaned.replace(",", ".");
  }
  const amount = parseFloat(cleaned);
  // Must be a reasonable marketplace price (>= 5, < 10M)
  if (!isNaN(amount) && amount >= 5 && amount < 10_000_000) {
    return amount;
  }
  return null;
}

/**
 * Get a short context window before a match: same line, up to 60 chars.
 */
function getContextBefore(text: string, matchIndex: number): string {
  const before = text.substring(0, matchIndex);
  const lastNewline = before.lastIndexOf("\n");
  return before.substring(Math.max(lastNewline + 1, matchIndex - 60));
}

interface PriceMatch {
  amount: number;
  currency: string;
  hasPositiveContext: boolean;
  hasNegativeContext: boolean;
}

/**
 * Collect all price matches from the text, then pick the best one:
 * 1. Prefer matches with positive selling context
 * 2. Prefer matches without negative context
 * 3. Fall back to the first match
 */
function findBestMatch(
  text: string,
  patterns: Array<{ regex: RegExp; currency: string; amountGroup: number }>,
  includeFallback = true
): PriceResult | null {
  const allMatches: PriceMatch[] = [];

  for (const { regex, currency, amountGroup } of patterns) {
    const globalRegex = new RegExp(
      regex.source,
      regex.flags.includes("g") ? regex.flags : regex.flags + "g"
    );
    const matches = [...text.matchAll(globalRegex)];

    for (const match of matches) {
      const amount = parseAmount(match[amountGroup]);
      if (amount === null) continue;

      const ctx = getContextBefore(text, match.index!);
      allMatches.push({
        amount,
        currency,
        hasPositiveContext: POSITIVE_CONTEXT.test(ctx),
        hasNegativeContext: NEGATIVE_CONTEXT.test(ctx) && !POSITIVE_CONTEXT.test(ctx),
      });
    }
  }

  if (allMatches.length === 0) return null;

  // 1. Prefer positive-context matches ("selling for", "продам за")
  const positive = allMatches.find((m) => m.hasPositiveContext);
  if (positive) return { amount: positive.amount, currency: positive.currency };

  // 2. Prefer non-negative matches
  const clean = allMatches.find((m) => !m.hasNegativeContext);
  if (clean) return { amount: clean.amount, currency: clean.currency };

  // 3. Fall back to first match (only if not all negative)
  if (includeFallback) {
    return { amount: allMatches[0].amount, currency: allMatches[0].currency };
  }

  return null;
}

export function extractPrice(text: string): PriceResult | null {
  // First try contextual patterns (highest confidence, no fallback to negative-context matches)
  const contextResult = findBestMatch(text, CONTEXT_PATTERNS, false);
  if (contextResult) return contextResult;

  // Then try standard patterns
  return findBestMatch(text, PRICE_PATTERNS);
}
