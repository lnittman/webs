import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const geminiModel = google("gemini-2.0-flash");

/**
 * Generates a plan for search terms based on context
 */
export const search_plan = createTool({
  id: "Search Plan",
  inputSchema: z.object({
    context: z.string().describe("Current context/knowledge accumulated so far"),
    query: z.string().describe("The original user query"),
    count: z.number().min(1).max(5).default(3).describe("Number of search terms to generate"),
  }),
  description: "Generates ideal search terms based on the current context to guide the next steps in exploration",
  execute: async ({ context }) => {
    try {
      const { text } = await generateText({
        model: geminiModel,
        prompt: `Based on the following context and original query, generate ${context.count} specific search terms 
        that would help expand knowledge on this topic. These terms should focus on areas that appear to be missing 
        in the current context or would provide valuable additional perspectives.
        
        Original query: "${context.query}"
        
        Current context:
        ${context.context}
        
        Return your response as a JSON array of strings containing only the search terms, with no additional text.
        `
      });

      let searchTerms = [];
      try {
        // Extract JSON array from the response
        if (text.includes("[") && text.includes("]")) {
          const jsonStr = text.substring(text.indexOf("["), text.lastIndexOf("]") + 1);
          searchTerms = JSON.parse(jsonStr);
        } else {
          // Fallback: split by lines or commas
          searchTerms = text.split(/[\n,]+/).map(term => term.trim()).filter(Boolean);
        }
      } catch (parseError) {
        console.error("Error parsing search terms:", parseError);
        searchTerms = [];
      }

      return { searchTerms };
    } catch (error) {
      console.error("Error in search_plan tool:", error);
      return { 
        searchTerms: [],
        error: String(error)
      };
    }
  },
}); 