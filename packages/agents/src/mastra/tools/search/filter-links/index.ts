import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { loadPromptTemplate, fillTemplate } from "../../../utils/loadPrompt";

const geminiModel = google("gemini-2.0-flash") as any;

// Load the prompt template
const promptTemplate = loadPromptTemplate(
  "tools/prompts/filter_links.xml",
);

/**
 * Filters and prioritizes links from a webpage based on relevance
 */
export const filter_links = createTool({
  id: "filter_links",
  inputSchema: z.object({
    links: z.array(z.string()).describe("Array of links to filter"),
    sourceUrl: z.string().describe("The URL of the page where links were extracted"),
    context: z.string().describe("Current context or summary of the page content"),
    query: z.string().optional().describe("The original query that initiated the search"),
    maxLinks: z.number().min(1).max(20).default(5).describe("Maximum number of links to return"),
  }),
  description: "Filters and prioritizes links based on their relevance to the current context",
  execute: async ({ context }) => {
    console.log(`[FILTER_LINKS] Processing ${context.links.length} links from: ${context.sourceUrl}`);
    
    if (context.links.length === 0) {
      console.log(`[FILTER_LINKS] No links to process from: ${context.sourceUrl}`);
      return { relevantLinks: [] };
    }
    
    // Pre-filter obviously irrelevant links
    const preFilteredLinks = context.links.filter(link => {
      // Skip common irrelevant pages
      if (link.includes('/login') || 
          link.includes('/signin') || 
          link.includes('/signup') ||
          link.includes('/register') ||
          link.includes('/terms') ||
          link.includes('/privacy') ||
          link.includes('/contact') ||
          link.includes('/pricing') ||
          link.includes('twitter.com') ||
          link.includes('facebook.com') ||
          link.includes('linkedin.com') ||
          link.includes('/cdn-cgi/') ||
          link.includes('/api/') ||
          link.includes('.js') ||
          link.includes('.css') ||
          link.includes('.png') ||
          link.includes('.jpg') ||
          link.includes('.svg') ||
          link.includes('.ico')) {
        return false;
      }
      return true;
    });
    
    // If we have more than 30 links after pre-filtering, only keep the first 30
    // This avoids sending too much data to the LLM
    const limitedLinks = preFilteredLinks.length > 30 ? preFilteredLinks.slice(0, 30) : preFilteredLinks;
    
    console.log(`[FILTER_LINKS] After pre-filtering: ${limitedLinks.length}/${context.links.length} links remain`);
    
    if (limitedLinks.length === 0) {
      return { relevantLinks: [] };
    }
    
    // Format links for the LLM
    const linksText = limitedLinks.map((link, i) => 
      `${i+1}. ${link}`
    ).join('\n');
    
    // Get the original query or create one based on the first URL
    const query = context.query || `Information from ${context.sourceUrl}`;
    
    try {
      // Fill the prompt template with context
      const filledPrompt = fillTemplate(promptTemplate, {
        sourceUrl: context.sourceUrl,
        context: context.context,
        query,
        maxLinks: context.maxLinks.toString(),
        linksText
      });
      
      // Ask the LLM which links are most relevant to investigate further
      const { text } = await generateText({
        model: geminiModel,
        prompt: filledPrompt,
      });

      // Parse the response to extract links
      let relevantLinks: string[] = [];
      
      // Try to extract JSON array
      if (text.includes("[") && text.includes("]")) {
        const jsonStr = text.substring(text.indexOf("["), text.lastIndexOf("]") + 1);
        const parsedLinks = JSON.parse(jsonStr);
        
        // Extract just the URLs from the response (which might include reasons)
        relevantLinks = parsedLinks.map((item: any) => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item.url) return item.url;
          return null;
        }).filter(Boolean);
      } else {
        // Fallback: look for URLs in the text
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = text.match(urlRegex);
        relevantLinks = matches || [];
      }
      
      // Verify the links exist in our original list to avoid hallucinated URLs
      relevantLinks = relevantLinks.filter(link => context.links.includes(link));
      
      console.log(`[FILTER_LINKS] Selected ${relevantLinks.length} relevant links for: ${context.sourceUrl}`);
      
      return { 
        relevantLinks,
        filteredCount: context.links.length - relevantLinks.length,
        originalCount: context.links.length
      };
    } catch (error) {
      console.log(`[FILTER_LINKS] Error filtering links: ${error instanceof Error ? error.message : String(error)}`);
      // Fallback to top 5 links
      const fallbackLinks = preFilteredLinks.slice(0, Math.min(5, context.maxLinks));
      
      return { 
        relevantLinks: fallbackLinks,
        filteredCount: context.links.length - fallbackLinks.length,
        originalCount: context.links.length,
        error: String(error)
      };
    }
  },
});