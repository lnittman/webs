/**
 * Utility functions for estimating token counts in text
 */

/**
 * Models with their approximate tokens per character ratios
 * These are rough approximations for different model families
 */
export const TOKEN_RATIOS: Record<string, number> = {
  'gpt': 0.25,        // OpenAI models (GPT-3.5, GPT-4)
  'claude': 0.28,     // Anthropic models
  'gemini': 0.27,     // Google Gemini models  
  'llama': 0.26,      // Meta LLama models
  'mistral': 0.26,    // Mistral models
  'default': 0.25     // Default approximation
};

/**
 * Estimate token count for text using approximate ratios
 * 
 * @param text The text to estimate tokens for
 * @param model Optional model family to use for estimation
 * @returns An object with estimated token counts for different models
 */
export function estimateTokens(text: string, model?: string): { 
  count: number;
  byModel: Record<string, number>;
  visual: string;
} {
  if (!text) return { count: 0, byModel: {}, visual: '0 tokens' };
  
  // Remove extra whitespace and normalize
  const normalized = text.replace(/\s+/g, ' ').trim();
  const charCount = normalized.length;
  const wordCount = normalized.split(/\s+/).length;
  
  // Generate estimates for each model family
  const estimates: Record<string, number> = {};
  
  for (const [modelFamily, ratio] of Object.entries(TOKEN_RATIOS)) {
    // Use character count * ratio, with word count as a minimum
    estimates[modelFamily] = Math.max(
      Math.ceil(charCount * ratio),
      Math.floor(wordCount * 0.75)
    );
  }
  
  // Get the estimate for the specified model or use average
  const primaryCount = model && TOKEN_RATIOS[model] 
    ? estimates[model]
    : estimates.default;
  
  // Format visual representation
  const visual = formatTokenVisual(primaryCount, charCount, wordCount);
  
  return {
    count: primaryCount,
    byModel: estimates,
    visual
  };
}

/**
 * Format a visual representation of token usage
 */
function formatTokenVisual(tokens: number, chars: number, words: number): string {
  let sizeCategory: string;
  
  if (tokens < 1000) {
    sizeCategory = 'very small';
  } else if (tokens < 2000) {
    sizeCategory = 'small';
  } else if (tokens < 4000) {
    sizeCategory = 'medium';
  } else if (tokens < 8000) {
    sizeCategory = 'large';
  } else if (tokens < 16000) {
    sizeCategory = 'very large';
  } else {
    sizeCategory = 'extremely large';
  }
  
  return `~${tokens.toLocaleString()} tokens (${sizeCategory}, ${words.toLocaleString()} words, ${chars.toLocaleString()} chars)`;
} 