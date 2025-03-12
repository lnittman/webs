import fetch from 'node-fetch';
import DatabaseManager, { Page } from './database';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

interface SummaryOptions {
  apiKey: string;
  maxContentLength?: number;
  useCache?: boolean;
}

export interface SummaryResponse {
  title: string;
  overview: string;
  keyTopics: string[];
  relatedLinks: string[];
}

// Simple in-memory cache for summaries
const summaryCache = new Map<string, { timestamp: number; data: SummaryResponse }>();

/**
 * Generate a summary of the content for a given URL and related pages
 * 
 * @param url - The root URL to summarize
 * @param options - Options for the summary generation
 * @returns A promise that resolves to the summary response
 */
export async function generateSummary(url: string, options: SummaryOptions): Promise<SummaryResponse> {
  const useCache = options.useCache !== false;
  
  // Check in-memory cache first
  if (useCache && summaryCache.has(url)) {
    const cached = summaryCache.get(url)!;
    const now = Date.now();
    
    // Use cache if it's less than 24 hours old
    if (now - cached.timestamp < 24 * 60 * 60 * 1000) {
      return cached.data;
    }
  }
  
  // Check file cache next
  if (useCache) {
    const cachedSummary = loadSummaryFromCache(url);
    if (cachedSummary) {
      // Update in-memory cache
      summaryCache.set(url, { timestamp: Date.now(), data: cachedSummary });
      return cachedSummary;
    }
  }
  
  const db = DatabaseManager.getInstance();
  
  // Get the root page from database
  const rootPage = db.getPageByUrl(url);
  if (!rootPage) {
    throw new Error(`No content found for URL: ${url}`);
  }
  
  // Get all related pages from database
  const pages = getAllRelatedPages(rootPage);
  
  // Prepare the content (limiting size to avoid token limits)
  const content = prepareContentForSummary(pages, options.maxContentLength || 100000);
  
  // Call the OpenRouter API
  const response = await callOpenRouterAPI(content, options.apiKey);
  
  // Cache the response
  if (useCache) {
    summaryCache.set(url, { timestamp: Date.now(), data: response });
    saveSummaryToCache(url, response);
  }
  
  return response;
}

/**
 * Get all pages related to the root page
 * 
 * @param rootPage - The root page
 * @returns An array of pages related to the root page
 */
function getAllRelatedPages(rootPage: Page): Page[] {
  const db = DatabaseManager.getInstance();
  const pages: Page[] = [rootPage];
  
  // Get links from the root page
  const links = db.getLinksBySourceId(rootPage.id!);
  
  // Get pages for each link
  for (const link of links) {
    const targetPage = db.getPageByUrl(link.targetUrl);
    if (targetPage) {
      pages.push(targetPage);
    }
  }
  
  return pages;
}

/**
 * Prepare content for summarization by combining pages and limiting content length
 * 
 * @param pages - The pages to include in the summary
 * @param maxLength - The maximum length of the combined content
 * @returns The prepared content
 */
function prepareContentForSummary(pages: Page[], maxLength: number): string {
  let combinedContent = '';
  
  // Add the root page first (assuming it's the first in the array)
  const rootPage = pages[0];
  combinedContent += `# ${rootPage.title}\nURL: ${rootPage.url}\n\n${rootPage.content}\n\n---\n\n`;
  
  // Add the rest of the pages
  for (let i = 1; i < pages.length; i++) {
    const page = pages[i];
    const pageContent = `## ${page.title}\nURL: ${page.url}\n\n${page.content}\n\n---\n\n`;
    
    // Check if adding this page would exceed the max length
    if (combinedContent.length + pageContent.length > maxLength) {
      combinedContent += `\n\n[Content truncated due to length limitations. ${pages.length - i} more pages were fetched but not included in summary.]\n`;
      break;
    }
    
    combinedContent += pageContent;
  }
  
  return combinedContent;
}

/**
 * Call the OpenRouter API to generate a summary
 * 
 * @param content - The content to summarize
 * @param apiKey - The OpenRouter API key
 * @returns A promise that resolves to the summary response
 */
async function callOpenRouterAPI(content: string, apiKey: string): Promise<SummaryResponse> {
  const prompt = `
  You are an AI assistant tasked with summarizing web content. The following is content fetched from a website:
  
  ${content}
  
  Please provide a structured summary with the following sections:
  1. A title that represents the main topic
  2. A brief overview (2-3 paragraphs)
  3. Key topics covered (as a bullet list)
  4. Important related links mentioned in the content (if any)
  
  Format your response in a structured JSON with these keys: title, overview, keyTopics (array), relatedLinks (array).
  `;
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://web-cli.local' // Replace with appropriate domain
      },
      body: JSON.stringify({
        model: 'google/gemini-2-flash-001',
        messages: [
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errorData}`);
    }
    
    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error('Invalid response format from OpenRouter API');
    }
    
    // Extract the content from the response
    const summaryContent = JSON.parse(data.choices[0].message.content);
    return summaryContent as SummaryResponse;
  } catch (error) {
    throw new Error(`Failed to generate summary: ${(error as Error).message}`);
  }
}

/**
 * Load a summary from the cache
 * 
 * @param url - The URL to load the summary for
 * @returns The cached summary or undefined if not found
 */
function loadSummaryFromCache(url: string): SummaryResponse | undefined {
  const cacheFile = getCacheFilePath(url);
  
  if (existsSync(cacheFile)) {
    try {
      const cacheData = JSON.parse(readFileSync(cacheFile, 'utf-8'));
      
      // Validate cache data
      if (!cacheData.timestamp || !cacheData.data) {
        return undefined;
      }
      
      // Check if cache is still valid (less than 24 hours old)
      const now = Date.now();
      if (now - cacheData.timestamp > 24 * 60 * 60 * 1000) {
        return undefined;
      }
      
      return cacheData.data;
    } catch (error) {
      // If there's an error reading the cache, just return undefined
      return undefined;
    }
  }
  
  return undefined;
}

/**
 * Save a summary to the cache
 * 
 * @param url - The URL to save the summary for
 * @param data - The summary to save
 */
function saveSummaryToCache(url: string, data: SummaryResponse): void {
  const cacheDir = join(homedir(), '.web-cli', 'cache');
  
  // Create cache directory if it doesn't exist
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }
  
  const cacheFile = getCacheFilePath(url);
  
  // Save the data with timestamp
  const cacheData = {
    timestamp: Date.now(),
    data
  };
  
  writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2), 'utf-8');
}

/**
 * Get the path to the cache file for a URL
 * 
 * @param url - The URL to get the cache file path for
 * @returns The path to the cache file
 */
function getCacheFilePath(url: string): string {
  // Create a unique filename based on the URL
  const urlHash = Buffer.from(url).toString('base64').replace(/[/+=]/g, '_');
  return join(homedir(), '.web-cli', 'cache', `${urlHash}.json`);
} 