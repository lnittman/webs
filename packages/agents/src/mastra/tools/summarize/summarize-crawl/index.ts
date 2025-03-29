import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

// @ts-ignore - Ignore version compatibility issues with the AI SDK
const geminiModel = google("gemini-2.0-flash");

/**
 * Summarizes an entire crawl based on group summaries
 */
export const summarize_crawl = createTool({
  id: "Summarize Crawl",
  inputSchema: z.object({
    groupSummaries: z.array(z.object({
      groupSummary: z.string(),
      groupName: z.string().optional(),
    })).describe("Array of group summaries to synthesize"),
    query: z.string().optional().describe("The original query that initiated the crawl"),
  }),
  description: "Synthesizes an overall summary from group summaries",
  execute: async ({ context }) => {
    console.log(`[SUMMARIZE_CRAWL] Starting with ${context.groupSummaries.length} group summaries`);
    
    try {
      // Create a combined text of all group summaries
      const combinedText = context.groupSummaries.map(item => 
        `Group: ${item.groupName || "Unnamed group"}
        Summary: ${item.groupSummary}
        `
      ).join("\n\n");

      console.log(`[SUMMARIZE_CRAWL] Generating comprehensive summary for ${context.groupSummaries.length} groups${context.query ? ` related to: "${context.query.substring(0, 30)}${context.query.length > 30 ? '...' : ''}"` : ''}`);
      
      // @ts-ignore - Ignore version compatibility issues with the AI SDK
      const { text } = await generateText({
        model: geminiModel,
        prompt: `Synthesize the following group summaries into a comprehensive overview 
        of 4-5 sentences that captures the major findings and insights${context.query ? ` related to the query: "${context.query}"` : ''}.
        
        ${combinedText}
        
        <crawl_summary>
        `
      });

      let crawlSummary = text;
      
      // Clean up the response
      if (crawlSummary.includes("<crawl_summary>")) {
        crawlSummary = crawlSummary.split("<crawl_summary>")[1];
      }
      if (crawlSummary.includes("</crawl_summary>")) {
        crawlSummary = crawlSummary.split("</crawl_summary>")[0];
      }
      
      console.log(`[SUMMARIZE_CRAWL] Completed summary of ${context.groupSummaries.length} groups`);
      
      return { 
        crawlSummary: crawlSummary.trim(),
        groupCount: context.groupSummaries.length
      };
    } catch (error) {
      console.log(`[SUMMARIZE_CRAWL] Error generating summary: ${error instanceof Error ? error.message : String(error)}`);
      return { 
        crawlSummary: "Failed to generate crawl summary",
        groupCount: context.groupSummaries.length,
        error: String(error)
      };
    }
  },
}); 