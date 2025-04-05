import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { loadPromptTemplate, fillTemplate } from "../../../utils/loadPrompt";

// Load the prompt template
const promptTemplate = loadPromptTemplate("tools/search/search-web/prompt.xml");

/**
 * Searches the web to find relevant URLs
 */
export const search_web = createTool({
  id: "search_web",
  inputSchema: z.object({
    query: z.string().describe("The search query to find relevant information"),
  }),
  description: "Performs web search to find related URLs",
  execute: async ({ context }) => {
    try {
      // Fill the prompt template with context
      const prompt = fillTemplate(promptTemplate, {
        query: context.query
      });

      // Use Gemini's capabilities to generate search results
      const { text } = await generateText({
        model: google("gemini-2.0-flash"),
        prompt
      });

      // Parse the response to extract URLs
      const jsonStr = text.substring(text.indexOf("["), text.lastIndexOf("]") + 1);
      const urls = JSON.parse(jsonStr);

      return { urls };
    } catch (error) {
      console.error("Error in search_web tool:", error);
      return { urls: [], error: String(error) };
    }
  },
}); 