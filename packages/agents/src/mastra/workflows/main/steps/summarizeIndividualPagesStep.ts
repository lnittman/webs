import { Step } from "@mastra/core/workflows";
import { z } from "zod";
import { summarize_single } from "../../../tools/summarize/summarize-single";

export const summarizeIndividualPagesStep = new Step({
  id: "summarizeIndividualPages",
  execute: async ({ context }) => {
    console.log(`[WORKFLOW:summarizeIndividualPages] Creating individual summaries for crawled pages`);
    
    // Get crawl results from the previous step
    const crawlResults = context.getStepResult('crawlRelatedLinks')?.results || [];
    const originalPrompt = context.getStepResult('analyzeInput')?.originalPrompt || '';
    
    // Also include the initial crawl result if available
    const initialCrawl = context.getStepResult('initialCrawl');
    if (initialCrawl && initialCrawl.content && initialCrawl.url) {
      crawlResults.push(initialCrawl);
    }
    
    console.log(`[WORKFLOW:summarizeIndividualPages] Summarizing ${crawlResults.length} pages`);
    
    // Filter out failed crawls
    const validCrawls = crawlResults.filter(result => result && result.content && !result.error);
    
    if (validCrawls.length === 0) {
      console.log(`[WORKFLOW:summarizeIndividualPages] No valid crawls to summarize`);
      return { summaries: [] };
    }
    
    // Create a summary for each crawled page in parallel
    const summaryPromises = validCrawls.map(async (crawl) => {
      try {
        // Use the summarize_single tool to create a summary
        const result = await summarize_single.execute({
          context: {
            content: crawl.content,
            url: crawl.url,
            title: crawl.title || crawl.url,
            query: originalPrompt
          }
        });
        
        return {
          url: crawl.url,
          title: crawl.title || crawl.url,
          summary: result.summary,
          key_points: result.key_points
        };
      } catch (error) {
        console.error(`[WORKFLOW:summarizeIndividualPages] Error summarizing ${crawl.url}: ${error}`);
        return {
          url: crawl.url,
          title: crawl.title || crawl.url,
          summary: `Failed to summarize: ${error instanceof Error ? error.message : String(error)}`,
          error: true
        };
      }
    });
    
    // Wait for all summaries to complete
    const summaries = await Promise.all(summaryPromises);
    
    // Filter out failed summaries
    const validSummaries = summaries.filter(summary => !summary.error);
    
    console.log(`[WORKFLOW:summarizeIndividualPages] Created ${validSummaries.length} summaries out of ${summaries.length} attempts`);
    
    return {
      summaries: validSummaries,
      prompt: originalPrompt
    };
  }
});