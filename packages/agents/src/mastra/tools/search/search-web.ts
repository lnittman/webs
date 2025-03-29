import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const geminiModel = google("gemini-2.0-flash");

/**
 * Searches the web to find relevant URLs
 */
export const search_web = createTool({
  id: "Search Web",
  inputSchema: z.object({
    query: z.string().describe("The search query to find relevant information"),
  }),
  description: "Performs web search to find related URLs",
  execute: async ({ context }) => {
    try {
      // Use Gemini's capabilities to generate search results
      const { text } = await generateText({
        model: geminiModel,
        prompt: `Find the most relevant URLs for this query: "${context.query}". 
        Return a JSON array of URLs only, with no explanations.`
      });

      // Parse the response to extract URLs
      let urls = [];
      try {
        // The model should return a JSON array, but let's handle other formats too
        if (text.includes("[") && text.includes("]")) {
          const jsonStr = text.substring(text.indexOf("["), text.lastIndexOf("]") + 1);
          urls = JSON.parse(jsonStr);
        } else {
          // Fallback: extract URLs with regex
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          urls = [...text.matchAll(urlRegex)].map(match => match[0]);
        }
      } catch (parseError) {
        console.error("Error parsing URLs:", parseError);
        urls = [];
      }

      return { urls };
    } catch (error) {
      console.error("Error in search_web tool:", error);
      return { urls: [], error: String(error) };
    }
  },
}); 