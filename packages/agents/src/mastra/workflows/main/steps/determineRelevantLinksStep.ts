import { Step } from "@mastra/core/workflows";
import { z } from "zod";
import * as tools from "../../../tools";

// Define interface for filter links result
interface FilterLinksResult {
  relevantLinks: string[];
}

export const determineRelevantLinksStep = new Step({
  id: "determineRelevantLinks",
  inputSchema: z.object({
    extractedLinks: z.array(z.string()),
    sourceUrl: z.string(),
    originalQuery: z.string().optional(),
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    console.log(`[WORKFLOW:determineRelevantLinks] Processing ${context.inputData.extractedLinks.length} links for: ${context.inputData.sourceUrl}`);
    
    if (context.inputData.extractedLinks.length === 0) {
      console.log(`[WORKFLOW:determineRelevantLinks] No links to process for: ${context.inputData.sourceUrl}`);
      return { relevantLinks: [] };
    }
    
    // Get the original query or create one based on the first URL
    const query = context.inputData.originalQuery || `Information from ${context.inputData.sourceUrl}`;
    
    try {
      // Use the filter_links tool to determine relevant links
      if (!tools.filter_links || !tools.filter_links.execute) {
        throw new Error("filter_links tool not available");
      }
      
      const result = await tools.filter_links.execute({
        context: {
          links: context.inputData.extractedLinks,
          sourceUrl: context.inputData.sourceUrl,
          context: context.inputData.summary,
          query: query,
          maxLinks: 20 // Allow more links for a comprehensive crawl
        }
      }) as FilterLinksResult;
      
      console.log(`[WORKFLOW:determineRelevantLinks] Selected ${result.relevantLinks.length} relevant links for: ${context.inputData.sourceUrl}`);
      
      return { relevantLinks: result.relevantLinks };
    } catch (error) {
      console.log(`[WORKFLOW:determineRelevantLinks] Error using filter_links tool: ${error instanceof Error ? error.message : String(error)}`);
      
      // Fallback to basic filtering if the tool fails
      // Pre-filter obviously irrelevant links
      const preFilteredLinks = context.inputData.extractedLinks.filter(link => {
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
      
      // Limit to 5 links as a fallback
      const fallbackLinks = preFilteredLinks.slice(0, 5);
      console.log(`[WORKFLOW:determineRelevantLinks] Fallback: selected ${fallbackLinks.length} links for: ${context.inputData.sourceUrl}`);
      
      return { relevantLinks: fallbackLinks };
    }
  }
}); 