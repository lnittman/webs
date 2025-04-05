import { generateText } from "ai";
import { z } from "zod";
import { google } from "@ai-sdk/google";
import { createTool } from "@mastra/core/tools";
import { loadPromptTemplate, fillTemplate } from "../../../utils/loadPrompt";

// Load the prompt template
const promptTemplate = loadPromptTemplate("tools/summarize/summarize-all/prompt.xml", `
<prompt>
  <task>
    Create a comprehensive summary of all the following content:
    
    {{content}}
    
    The user's query is: {{query}}
  </task>
  
  <guidelines>
    <guideline>Synthesize all the information into a unified summary</guideline>
    <guideline>Identify the most important themes across all sources</guideline>
    <guideline>Focus on aspects relevant to the user's query</guideline>
    <guideline>Highlight connections between different sources</guideline>
    <guideline>Be concise but thorough - capture key insights</guideline>
    <guideline>Maintain factual accuracy while condensing information</guideline>
    <guideline>Note any significant disagreements between sources</guideline>
    <guideline>Limit summary to {{max_length}} words</guideline>
  </guidelines>
  
  <output_format>
    Provide:
    1. A comprehensive summary that addresses the user's query
    2. 5-7 key points that encompass the main insights
    3. A brief section on limitations or gaps in the information
  </output_format>
</prompt>
`);

/**
 * Summarizes an entire set of pages based on group summaries
 */
export const summarize_all = createTool({
  id: "Summarize All",
  inputSchema: z.object({
    groupSummaries: z.array(z.object({
      groupSummary: z.string(),
      groupName: z.string().optional(),
    })).describe("Array of group summaries to synthesize"),
    query: z.string().optional().describe("The original query that initiated the crawl"),
  }),
  description: "Synthesizes an overall summary from group summaries",
  execute: async ({ context }) => {
    console.log(`[SUMMARIZE_ALL] Starting with ${context.groupSummaries.length} group summaries`);
    
    try {
      // Create a combined text of all group summaries
      const combinedText = context.groupSummaries.map(item => 
        `Group: ${item.groupName || "Unnamed group"}
        Summary: ${item.groupSummary}
        `
      ).join("\n\n");

      console.log(`[SUMMARIZE_ALL] Generating comprehensive summary for ${context.groupSummaries.length} groups${context.query ? ` related to: "${context.query.substring(0, 30)}${context.query.length > 30 ? '...' : ''}"` : ''}`);
      
      // Format group summaries for template
      const groupSummariesText = combinedText;

      // Fill the prompt template with context
      const prompt = fillTemplate(promptTemplate, {
        groupSummariesText,
        query: context.query || ''
      });
      
      // @ts-ignore - Ignore version compatibility issues with the AI SDK
      const { text } = await generateText({
        model: google("gemini-2.0-flash"),
        prompt
      });

      let crawlSummary = text;

      console.log(`[SUMMARIZE_ALL] Completed summary of ${context.groupSummaries.length} groups`);
      
      return { 
        crawlSummary: crawlSummary.trim(),
        groupCount: context.groupSummaries.length
      };
    } catch (error) {
      console.log(`[SUMMARIZE_ALL] Error generating summary: ${error instanceof Error ? error.message : String(error)}`);
      return { 
        crawlSummary: "Failed to generate crawl summary",
        groupCount: context.groupSummaries.length,
        error: String(error)
      };
    }
  },
}); 