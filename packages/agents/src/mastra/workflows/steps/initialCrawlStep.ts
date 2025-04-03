import { Step } from "@mastra/core/workflows";
import { z } from "zod";
import * as tools from "../../tools";

// Define interface for the crawl result
interface CrawlResult {
  url: string;
  content?: string;
  title?: string;
  links?: string[];
  error?: string;
}

export const initialCrawlStep = new Step({
  id: "initialCrawl",
  inputSchema: z.object({
    primaryUrl: z.string().optional().describe("The primary URL to crawl"),
    extractedUrls: z.array(z.string()).describe("All URLs extracted from the prompt"),
  }),
  execute: async ({ context }) => {
    const primaryUrl = context.inputData.primaryUrl;
    const extractedUrls = context.inputData.extractedUrls;
    
    // Skip if no URLs are provided
    if (extractedUrls.length === 0) {
      console.log(`[WORKFLOW:initialCrawl] Skipping crawl - no URLs provided`);
      return { crawlSkipped: true };
    }
    
    // Determine which URL to crawl - either the primary one or the first extracted URL
    const urlToCrawl = primaryUrl || extractedUrls[0];
    
    console.log(`[WORKFLOW:initialCrawl] Crawling URL: ${urlToCrawl}`);
    
    try {
      // Check if the crawl_single tool is available
      if (!tools.crawl_single || !tools.crawl_single.execute) {
        console.error(`[WORKFLOW:initialCrawl] crawl_single tool not found`);
        return { 
          error: "Crawl tool not available",
          url: urlToCrawl
        };
      }
      
      // Crawl the URL
      const result = await tools.crawl_single.execute({
        context: {
          url: urlToCrawl
        }
      }) as CrawlResult;
      
      console.log(`[WORKFLOW:initialCrawl] Crawl completed. Content length: ${result.content?.length || 0} chars`);
      
      // Return the crawl results
      return {
        url: urlToCrawl,
        content: result.content,
        title: result.title,
        error: result.error,
        links: result.links,
        allExtractedUrls: extractedUrls // Pass all URLs for potential further processing
      };
    } catch (error) {
      console.error(`[WORKFLOW:initialCrawl] Error: ${error instanceof Error ? error.message : String(error)}`);
      return {
        url: urlToCrawl,
        error: error instanceof Error ? error.message : String(error),
        allExtractedUrls: extractedUrls
      };
    }
  }
}); 