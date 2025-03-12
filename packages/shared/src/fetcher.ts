import fetch from 'node-fetch';
import { createPage, createLink } from './database';

export interface FetchedContent {
  url: string;
  title: string;
  markdown: string;
  error?: string;
}

/**
 * Fetch content from r.jina.ai for the given URL
 */
export async function fetchContent(url: string): Promise<FetchedContent> {
  try {
    const normalizedUrl = normalizeUrl(url);
    const jinaUrl = `https://r.jina.ai/${normalizedUrl}`;
    
    const response = await fetch(jinaUrl);
    
    if (!response.ok) {
      return {
        url: normalizedUrl,
        title: '',
        markdown: '',
        error: `Failed to fetch content: ${response.statusText}`
      };
    }
    
    const markdown = await response.text();
    const title = extractTitle(markdown) || normalizedUrl;
    
    return {
      url: normalizedUrl,
      title,
      markdown
    };
  } catch (error) {
    return {
      url,
      title: '',
      markdown: '',
      error: `Error fetching content: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Store fetched content in the database
 */
export async function storeContent(
  content: FetchedContent, 
  workspaceId?: string
): Promise<string> {
  if (content.error || !content.markdown) {
    throw new Error(`Cannot store content for ${content.url}: ${content.error || 'No content'}`);
  }
  
  // Create the page
  const page = await createPage({
    url: content.url,
    title: content.title,
    content: content.markdown,
    workspaceId
  });
  
  // Extract and store links
  const links = extractLinks(content.markdown, content.url);
  
  for (const link of links) {
    await createLink({
      sourceId: page.id,
      targetUrl: link
    });
  }
  
  return page.id;
}

/**
 * Extract links from markdown content
 */
export function extractLinks(markdown: string, baseUrl: string): string[] {
  const linkRegex = /\[.*?\]\((.*?)\)/g;
  const links: string[] = [];
  let match;
  
  while ((match = linkRegex.exec(markdown)) !== null) {
    let link = match[1].split(' ')[0]; // Remove any trailing space or title
    
    // Remove any fragment identifier or query string
    link = link.split('#')[0].split('?')[0];
    
    // Skip if the link is empty after processing
    if (!link) continue;
    
    // If the link is relative, resolve it against the base URL
    if (!link.startsWith('http')) {
      link = resolveUrl(baseUrl, link);
    }
    
    // Skip non-HTTP/HTTPS links
    if (!link.startsWith('http')) continue;
    
    links.push(link);
  }
  
  // Filter to unique links
  return [...new Set(links)];
}

/**
 * Normalize a URL (lowercase, remove trailing slashes)
 */
function normalizeUrl(url: string): string {
  let normalizedUrl = url.trim().toLowerCase();
  
  // Ensure URL has a protocol
  if (!normalizedUrl.startsWith('http')) {
    normalizedUrl = `https://${normalizedUrl}`;
  }
  
  // Remove trailing slash if present
  if (normalizedUrl.endsWith('/')) {
    normalizedUrl = normalizedUrl.slice(0, -1);
  }
  
  return normalizedUrl;
}

/**
 * Extract the title from markdown content
 */
function extractTitle(markdown: string): string | undefined {
  // Try to find the first h1 heading
  const headingMatch = markdown.match(/^# (.*?)$/m);
  if (headingMatch && headingMatch[1]) {
    return headingMatch[1].trim();
  }
  
  // Fall back to using the first line if it's not too long
  const firstLine = markdown.split('\n')[0];
  if (firstLine && firstLine.length < 100) {
    return firstLine.trim();
  }
  
  return undefined;
}

/**
 * Resolve a relative URL against a base URL
 */
export function resolveUrl(baseUrl: string, relativeUrl: string): string {
  try {
    const base = new URL(baseUrl);
    
    // Handle protocol-relative URLs
    if (relativeUrl.startsWith('//')) {
      return `${base.protocol}${relativeUrl}`;
    }
    
    // Handle absolute paths
    if (relativeUrl.startsWith('/')) {
      return `${base.protocol}//${base.hostname}${relativeUrl}`;
    }
    
    // Handle relative paths
    return new URL(relativeUrl, base).toString();
  } catch (error) {
    // If URL creation fails, return the original relative URL
    return relativeUrl;
  }
} 