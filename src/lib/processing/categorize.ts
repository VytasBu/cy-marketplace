import { createServiceClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

interface CategorizationResult {
  categoryId: number;
  method: "keyword" | "llm";
}

let cachedCategories: Category[] | null = null;

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
 * Check if a keyword matches in text with word boundary awareness.
 * Short keywords (≤3 chars) require word boundaries to prevent
 * false positives like "пк" matching inside "кнопка".
 */
function keywordMatchesInText(keyword: string, text: string): boolean {
  const lowerKeyword = keyword.toLowerCase();

  // Short keywords need word boundary matching
  if (lowerKeyword.length <= 3) {
    // Build regex with unicode word boundaries
    // Use lookbehind/lookahead for non-word chars or start/end of string
    const escaped = lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|[\\s,.!?;:()\\[\\]{}"\\/\\-–—])${escaped}(?:$|[\\s,.!?;:()\\[\\]{}"\\/\\-–—])`, "i");
    return regex.test(text);
  }

  // Longer keywords can use simple substring matching
  return text.includes(lowerKeyword);
}

/**
 * Step 1: Keyword-based categorization.
 * Checks deepest categories first (level 2 → 1 → 0) for best specificity.
 */
function keywordMatch(
  text: string,
  categories: Category[]
): number | null {
  const lowerText = text.toLowerCase();
  let bestMatch: { categoryId: number; score: number } | null = null;

  // Categories are already sorted deepest first
  for (const cat of categories) {
    if (!cat.keywords || cat.keywords.length === 0) continue;

    let score = 0;
    for (const keyword of cat.keywords) {
      if (keywordMatchesInText(keyword, lowerText)) {
        score++;
      }
    }

    // Require at least 1 keyword match, prefer deeper categories
    // Give bonus to deeper levels for specificity
    const adjustedScore = score + cat.level * 0.5;

    if (score >= 1 && (!bestMatch || adjustedScore > bestMatch.score)) {
      bestMatch = { categoryId: cat.id, score: adjustedScore };
    }
  }

  // Require at least 1 keyword match
  return bestMatch ? bestMatch.categoryId : null;
}

/**
 * Step 2: LLM-based categorization using Claude API.
 * Only called when keyword matching fails.
 */
async function llmCategorize(
  text: string,
  categories: Category[]
): Promise<number | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  // Build a simplified category list for the prompt
  const categoryList = categories
    .filter((c) => c.level <= 1) // Only show top 2 levels to keep prompt short
    .map((c) => `${c.id}: ${c.name}${c.parent_id ? ` (sub of ${categories.find(p => p.id === c.parent_id)?.name})` : ""}`)
    .join("\n");

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
        max_tokens: 50,
        messages: [
          {
            role: "user",
            content: `Classify this marketplace listing into one of these categories. Reply with ONLY the category ID number.\n\nCategories:\n${categoryList}\n\nListing:\n${text.slice(0, 500)}`,
          },
        ],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.content?.[0]?.text?.trim();
    const categoryId = parseInt(content);

    if (!isNaN(categoryId) && categories.some((c) => c.id === categoryId)) {
      return categoryId;
    }
  } catch (error) {
    console.error("LLM categorization error:", error);
  }

  return null;
}

export async function categorize(
  originalText: string,
  translatedText: string | null
): Promise<CategorizationResult | null> {
  const categories = await getAllCategories();
  const combinedText = [originalText, translatedText].filter(Boolean).join(" ");

  // Step 1: Try keyword matching
  const keywordResult = keywordMatch(combinedText, categories);
  if (keywordResult) {
    return { categoryId: keywordResult, method: "keyword" };
  }

  // Step 2: Try LLM fallback
  const llmResult = await llmCategorize(combinedText, categories);
  if (llmResult) {
    return { categoryId: llmResult, method: "llm" };
  }

  // Fallback: "Other" category (id=12)
  return { categoryId: 12, method: "keyword" };
}

export function clearCategoryCache() {
  cachedCategories = null;
}
