import { Step } from "@mastra/core/workflows";
import { z } from "zod";
import * as tools from "../../../tools";

// Define the interface for the results
interface CrawlResult {
  url: string;
  title: string;
  summary: string;
  contentLength: number;
}

export const crawlRelatedLinksStep = new Step({
  id: "crawlRelatedLinks",
  inputSchema: z.object({
    relevantLinks: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    console.log(`[WORKFLOW:crawlRelatedLinks] Processing ${context.inputData.relevantLinks.length} relevant links`);
    
    const results: CrawlResult[] = [];
    const maxConcurrentRequests = 2; // Limit concurrent requests to avoid rate limiting
    const timeout = 30000; // 30-second timeout per request
    
    // Process links in small batches to avoid overwhelming the server
    for (let i = 0; i < context.inputData.relevantLinks.length; i += maxConcurrentRequests) {
      const currentBatch = context.inputData.relevantLinks.slice(i, i + maxConcurrentRequests);
      console.log(`[WORKFLOW:crawlRelatedLinks] Processing batch ${Math.floor(i/maxConcurrentRequests) + 1} (${currentBatch.length} links)`);
      
      // Process each link in the current batch with a timeout
      const batchPromises = currentBatch.map(async (link) => {
        try {
          console.log(`[WORKFLOW:crawlRelatedLinks] Crawling: ${link}`);
          
          // Create a promise that rejects after the timeout
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Crawl timed out')), timeout);
          });
          
          // Check if the read_url tool is available
          if (!tools.read_url || typeof tools.read_url.execute !== 'function') {
            throw new Error('read_url tool not available or not properly configured');
          }
          
          // Create the crawl promise
          const crawlPromise = tools.read_url.execute({ context: { url: link } });
          
          // Race between the crawl and the timeout
          const crawlResult = await Promise.race([crawlPromise, timeoutPromise]) as any;
          
          // If crawl was successful, also summarize the page
          if (crawlResult && crawlResult.content && !crawlResult.error) {
            console.log(`[WORKFLOW:crawlRelatedLinks] Summarizing: ${link} (${crawlResult.content.length} bytes)`);
            
            // Check if summarize_single tool is available
            if (!tools.summarize_single || typeof tools.summarize_single.execute !== 'function') {
              throw new Error('summarize_single tool not available or not properly configured');
            }
            
            // Summarize with timeout
            const summaryPromise = tools.summarize_single.execute({ 
              context: {
                content: crawlResult.content,
                url: link,
                title: crawlResult.title || ""
              } 
            });
            
            const summaryResult = await Promise.race([
              summaryPromise, 
              new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Summary timed out')), timeout))
            ]) as any;
            
            if (summaryResult && summaryResult.summary) {
              results.push({
                url: link,
                title: crawlResult.title || "",
                summary: summaryResult.summary,
                contentLength: crawlResult.content.length
              });
              console.log(`[WORKFLOW:crawlRelatedLinks] Completed: ${link} - Summary: ${summaryResult.summary.substring(0, 100)}...`);
            } else {
              console.log(`[WORKFLOW:crawlRelatedLinks] Skipped (no summary): ${link}`);
            }
          } else {
            console.log(`[WORKFLOW:crawlRelatedLinks] Skipped (error): ${link} - ${crawlResult?.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.log(`[WORKFLOW:crawlRelatedLinks] Error processing: ${link} - ${error instanceof Error ? error.message : String(error)}`);
        }
      });
      
      // Wait for all links in this batch to be processed before moving to the next batch
      await Promise.all(batchPromises);
    }
    
    console.log(`[WORKFLOW:crawlRelatedLinks] Completed ${results.length}/${context.inputData.relevantLinks.length} links successfully`);
    
    return { relatedResults: results };
  }
}); 