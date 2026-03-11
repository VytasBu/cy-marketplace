import { createServiceClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

interface CategorizationResult {
  categoryId: number;
  method: "keyword" | "llm";
}

let cachedCategories: Category[] | null = null;
let cachedCategoryTree: string | null = null;

async function getAllCategories(): Promise<Category[]> {
  if (cachedCategories) return cachedCategories;

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("level", { ascending: false }); // deepest first

  cachedCategories = (data as Category[]) || [];
  return cachedCategories;
}

/**
 * Build a compact tree representation of all categories for the LLM prompt.
 * Format:
 *   1: Electronics & Technology
 *     101: Phones & Tablets
 *       1011: iPhones
 *       1012: Android Phones
 */
function buildCategoryTree(categories: Category[]): string {
  if (cachedCategoryTree) return cachedCategoryTree;

  // Sort by level ascending, then sort_order
  const sorted = [...categories].sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.sort_order - b.sort_order;
  });

  const lines: string[] = [];
  for (const cat of sorted) {
    const indent = "  ".repeat(cat.level);
    lines.push(`${indent}${cat.id}: ${cat.name}`);
  }

  cachedCategoryTree = lines.join("\n");
  return cachedCategoryTree;
}

/**
 * Primary: LLM-based categorization using Claude Haiku.
 * Shows the full 3-level category hierarchy for maximum accuracy.
 */
async function llmCategorize(
  text: string,
  categories: Category[]
): Promise<number | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const categoryTree = buildCategoryTree(categories);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 20,
        messages: [
          {
            role: "user",
            content: `Classify this Cyprus marketplace listing into the most specific (deepest) category. Reply with ONLY the category ID number, nothing else.

Categories:
${categoryTree}

Listing:
${text.slice(0, 800)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("LLM categorization HTTP error:", response.status);
      return null;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text?.trim();
    const categoryId = parseInt(content);

    if (!isNaN(categoryId) && categories.some((c) => c.id === categoryId)) {
      return categoryId;
    }

    console.warn("LLM returned invalid category:", content);
  } catch (error) {
    console.error("LLM categorization error:", error);
  }

  return null;
}

/**
 * Check if a keyword matches in text with word boundary awareness.
 * Short keywords (≤3 chars) require word boundaries to prevent
 * false positives like "пк" matching inside "кнопка".
 */
function keywordMatchesInText(keyword: string, text: string): boolean {
  const lowerKeyword = keyword.toLowerCase();

  // Short keywords need word boundary matching
  if (lowerKeyword.length <= 3) {
    const escaped = lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|[\\s,.!?;:()\\[\\]{}"\\/\\-–—])${escaped}(?:$|[\\s,.!?;:()\\[\\]{}"\\/\\-–—])`, "i");
    return regex.test(text);
  }

  return text.includes(lowerKeyword);
}

/**
 * Fallback: Keyword-based categorization.
 * Used only when LLM is unavailable (no API key, API down, etc.)
 */
function keywordMatch(
  text: string,
  categories: Category[]
): number | null {
  const lowerText = text.toLowerCase();
  let bestMatch: { categoryId: number; score: number } | null = null;

  for (const cat of categories) {
    if (!cat.keywords || cat.keywords.length === 0) continue;

    let score = 0;
    for (const keyword of cat.keywords) {
      if (keywordMatchesInText(keyword, lowerText)) {
        score++;
      }
    }

    const adjustedScore = score + cat.level * 0.5;

    if (score >= 1 && (!bestMatch || adjustedScore > bestMatch.score)) {
      bestMatch = { categoryId: cat.id, score: adjustedScore };
    }
  }

  return bestMatch ? bestMatch.categoryId : null;
}

export async function categorize(
  originalText: string,
  translatedText: string | null
): Promise<CategorizationResult | null> {
  const categories = await getAllCategories();
  const combinedText = [originalText, translatedText].filter(Boolean).join(" ");

  // Step 1: Try LLM (primary — most accurate, ~$0.00015/listing)
  const llmResult = await llmCategorize(combinedText, categories);
  if (llmResult) {
    return { categoryId: llmResult, method: "llm" };
  }

  // Step 2: Keyword fallback (if LLM unavailable)
  const keywordResult = keywordMatch(combinedText, categories);
  if (keywordResult) {
    return { categoryId: keywordResult, method: "keyword" };
  }

  // Step 3: "Other" category (id=12)
  return { categoryId: 12, method: "keyword" };
}

export function clearCategoryCache() {
  cachedCategories = null;
  cachedCategoryTree = null;
}
