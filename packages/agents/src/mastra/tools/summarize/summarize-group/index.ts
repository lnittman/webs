import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const geminiModel = google("gemini-2.0-flash");

/**
 * Summarizes a group of related pages
 */
export const summarize_group = createTool({
  id: "Summarize Group",
  inputSchema: z.object({
    summaries: z.array(z.object({
      summary: z.string(),
      url: z.string().optional(),
      title: z.string().optional(),
    })).describe("Array of page summaries to synthesize"),
    groupName: z.string().optional().describe("Name or theme of the group"),
  }),
  description: "Summarizes a logical grouping of pages",
  execute: async ({ context }) => {
    try {
      // Create a combined text of all summaries with their sources
      const combinedText = context.summaries.map(item => 
        `Source: ${item.title || item.url || "Unknown"}
        Summary: ${item.summary}
        `
      ).join("\n\n");

      const { text } = await generateText({
        model: geminiModel,
        prompt: `Analyze the following summaries from related pages${context.groupName ? ` about "${context.groupName}"` : ''} 
        and provide a synthesized summary of 3-4 sentences that captures the common themes and key insights.
        
        ${combinedText}
        
        <group_summary>
        `
      });

      let groupSummary = text;
      
      // Clean up the response
      if (groupSummary.includes("<group_summary>")) {
        groupSummary = groupSummary.split("<group_summary>")[1];
      }
      if (groupSummary.includes("</group_summary>")) {
        groupSummary = groupSummary.split("</group_summary>")[0];
      }
      
      return { 
        groupSummary: groupSummary.trim(),
        groupName: context.groupName || "Related pages",
        sourceCount: context.summaries.length
      };
    } catch (error) {
      console.error("Error in summarize_group tool:", error);
      return { 
        groupSummary: "Failed to generate group summary",
        groupName: context.groupName || "Related pages",
        sourceCount: context.summaries.length,
        error: String(error)
      };
    }
  },
}); 