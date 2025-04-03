/**
 * Helper function to extract URLs from text
 */
export function extractUrls(text: string): string[] {
  // Simple URL extraction from text
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex) || [];
  return [...new Set(matches)]; // Remove duplicates
}

/**
 * Helper function to detect if a string is a URL
 */
export function isUrl(text: string): boolean {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
} 