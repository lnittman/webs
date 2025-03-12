import fetch from 'node-fetch';
import { prisma } from './db';
import { generateEmbedding } from './ai';

// Interface for the fetched content
export interface FetchedContent {
  url: string;
  title: string;
  markdown: string;
  error?: string;
}

/**
 * Fetch content from r.jina.ai
 */
export async function fetchContent(url: string): Promise<FetchedContent> {
  try {
    // Normalize the URL
    const normalizedUrl = normalizeUrl(url);
    
    // Check if the URL already exists in the database
    const existingPage = await prisma.page.findUnique({
      where: { url: normalizedUrl },
    });
    
    if (existingPage) {
      return {
        url: existingPage.url,
        title: existingPage.title,
        markdown: existingPage.content,
      };
    }
    
    // Fetch content from r.jina.ai
    const response = await fetch(`https://r.jina.ai/${encodeURIComponent(normalizedUrl)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.statusText}`);
    }
    
    const markdown = await response.text();
    
    // Extract title from markdown
    const title = extractTitle(markdown) || normalizedUrl;
    
    return {
      url: normalizedUrl,
      title,
      markdown,
    };
  } catch (error) {
    console.error(`Error fetching content for ${url}:`, error);
    return {
      url,
      title: url,
      markdown: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Store fetched content in the database
 */
export async function storeContent(
  content: FetchedContent, 
  workspaceId: string, 
  userId: string
): Promise<string> {
  try {
    // Generate embedding for the content
    const embedding = await generateEmbedding(content.markdown);
    
    // Store the page in the database
    const page = await prisma.page.create({
      data: {
        url: content.url,
        title: content.title,
        content: content.markdown,
        workspaceId,
      },
    });
    
    // Extract and store links
    const links = extractLinks(content.markdown, content.url);
    
    for (const link of links) {
      await prisma.link.create({
        data: {
          targetUrl: link,
          sourceId: page.id,
        },
      });
    }
    
    return page.id;
  } catch (error) {
    console.error(`Error storing content for ${content.url}:`, error);
    throw error;
  }
}

/**
 * Extract links from markdown content
 */
export function extractLinks(markdown: string, baseUrl: string): string[] {
  const linkRegex = /\[.*?\]\((.*?)\)/g;
  const links: string[] = [];
  let match;
  
  while ((match = linkRegex.exec(markdown)) !== null) {
    const link = match[1].split(' ')[0].trim();
    
    // Skip anchor links and empty links
    if (link.startsWith('#') || !link) {
      continue;
    }
    
    // Resolve relative URLs
    const resolvedUrl = resolveUrl(baseUrl, link);
    links.push(resolvedUrl);
  }
  
  return [...new Set(links)]; // Remove duplicates
}

/**
 * Normalize URL by removing trailing slashes, fragments, etc.
 */
function normalizeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    
    // Remove trailing slash
    let normalized = parsedUrl.origin + parsedUrl.pathname.replace(/\/$/, '');
    
    // Add query parameters if they exist
    if (parsedUrl.search) {
      normalized += parsedUrl.search;
    }
    
    return normalized;
  } catch (error) {
    // If URL parsing fails, return the original URL
    return url;
  }
}

/**
 * Extract title from markdown content
 */
function extractTitle(markdown: string): string | undefined {
  // Look for the first heading
  const headingMatch = markdown.match(/^#\s+(.+)$/m);
  
  if (headingMatch && headingMatch[1]) {
    return headingMatch[1].trim();
  }
  
  return undefined;
}

/**
 * Resolve a relative URL against a base URL
 */
export function resolveUrl(baseUrl: string, relativeUrl: string): string {
  try {
    // If the URL is already absolute, return it
    if (relativeUrl.match(/^https?:\/\//i)) {
      return relativeUrl;
    }
    
    // Otherwise, resolve it against the base URL
    const base = new URL(baseUrl);
    return new URL(relativeUrl, base).toString();
  } catch (error) {
    // If URL resolution fails, return the original URL
    return relativeUrl;
  }
} 