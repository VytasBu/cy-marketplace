interface PriceResult {
  amount: number;
  currency: string;
}

const PRICE_PATTERNS: Array<{
  regex: RegExp;
  currency: string;
  amountGroup: number;
}> = [
  // €100, 100€, EUR 100, 100 EUR
  { regex: /€\s*(\d[\d\s,.]*)/i, currency: "EUR", amountGroup: 1 },
  { regex: /(\d[\d\s,.]*)\s*€/i, currency: "EUR", amountGroup: 1 },
  { regex: /EUR\s*(\d[\d\s,.]*)/i, currency: "EUR", amountGroup: 1 },
  { regex: /(\d[\d\s,.]*)\s*EUR/i, currency: "EUR", amountGroup: 1 },
  // Russian: евро
  { regex: /(\d[\d\s,.]*)\s*евро/i, currency: "EUR", amountGroup: 1 },
  // $100, 100$, USD 100
  { regex: /\$\s*(\d[\d\s,.]*)/i, currency: "USD", amountGroup: 1 },
  { regex: /(\d[\d\s,.]*)\s*\$/i, currency: "USD", amountGroup: 1 },
  { regex: /USD\s*(\d[\d\s,.]*)/i, currency: "USD", amountGroup: 1 },
  { regex: /(\d[\d\s,.]*)\s*USD/i, currency: "USD", amountGroup: 1 },
  // Russian: долларов, доллар
  {
    regex: /(\d[\d\s,.]*)\s*доллар(?:ов|а|ы)?/i,
    currency: "USD",
    amountGroup: 1,
  },
  // British Pound
  { regex: /£\s*(\d[\d\s,.]*)/i, currency: "GBP", amountGroup: 1 },
  { regex: /(\d[\d\s,.]*)\s*£/i, currency: "GBP", amountGroup: 1 },
  // Russian Ruble
  { regex: /(\d[\d\s,.]*)\s*₽/i, currency: "RUB", amountGroup: 1 },
  { regex: /(\d[\d\s,.]*)\s*руб(?:лей|ля|ль|\.)?/i, currency: "RUB", amountGroup: 1 },
  { regex: /(\d[\d\s,.]*)\s*р\b/i, currency: "RUB", amountGroup: 1 },
];

export function extractPrice(text: string): PriceResult | null {
  for (const { regex, currency, amountGroup } of PRICE_PATTERNS) {
    const match = text.match(regex);
    if (match) {
      const rawAmount = match[amountGroup]
        .replace(/\s/g, "")
        .replace(",", ".");
      const amount = parseFloat(rawAmount);
      if (!isNaN(amount) && amount > 0 && amount < 10_000_000) {
        return { amount, currency };
      }
    }
  }

  return null;
}
