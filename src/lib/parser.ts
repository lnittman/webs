import MarkdownIt from 'markdown-it';

// Create a markdown-it instance
const md = new MarkdownIt();

/**
 * Extracts links from markdown content
 * 
 * @param markdown - The markdown content to parse
 * @returns An array of URLs extracted from the markdown
 */
export function extractLinks(markdown: string): string[] {
  const links: string[] = [];
  
  // Parse the markdown to HTML
  const html = md.render(markdown);
  
  // Extract links using a regular expression
  const linkRegex = /href="([^"]+)"/g;
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    if (match[1]) {
      links.push(match[1]);
    }
  }
  
  // Filter out invalid or duplicate links
  return filterLinks(links);
}

/**
 * Filters links to remove duplicates and invalid URLs
 * 
 * @param links - The array of links to filter
 * @returns A filtered array of links
 */
function filterLinks(links: string[]): string[] {
  const uniqueLinks = new Set<string>();
  
  links.forEach(link => {
    // Skip empty links, mailto links, tel links, and anchor links
    if (
      !link ||
      link.startsWith('mailto:') ||
      link.startsWith('tel:') ||
      link.startsWith('#') ||
      link.startsWith('javascript:')
    ) {
      return;
    }
    
    // Try to create a URL object to validate the link
    try {
      new URL(link);
      uniqueLinks.add(link);
    } catch (error) {
      // If the link is relative, we can't validate it with URL
      // But we'll still include it, since it might be a valid relative link
      if (link.startsWith('/') || link.startsWith('./') || link.startsWith('../')) {
        uniqueLinks.add(link);
      }
    }
  });
  
  return Array.from(uniqueLinks);
}

/**
 * Resolves a relative URL against a base URL
 * 
 * @param baseUrl - The base URL
 * @param relativeUrl - The relative URL
 * @returns The resolved absolute URL
 */
export function resolveUrl(baseUrl: string, relativeUrl: string): string {
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch (error) {
    // If resolving fails, return the original relative URL
    return relativeUrl;
  }
} 