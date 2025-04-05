import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { loadPromptTemplate, fillTemplate } from "../../../utils/loadPrompt";

// Load the prompt template with a fallback if the file isn't found
const promptTemplate = loadPromptTemplate("tools/search/search-web/prompt.xml", `
<prompt>
  <task>
    Generate a search query to find information about the following topic:
    
    {{query}}
  </task>
  
  <guidelines>
    <guideline>Create 3-5 search queries that will help find relevant information</guideline>
    <guideline>Focus on factual, informational websites</guideline>
    <guideline>Include specific terms to narrow results appropriately</guideline>
    <guideline>Vary the queries to get diverse perspectives</guideline>
    <guideline>Avoid overly broad or vague queries</guideline>
  </guidelines>
  
  <output_format>
    Return multiple search queries, each on a separate line.
    Then explain why each query would be useful.
  </output_format>
</prompt>
`);

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