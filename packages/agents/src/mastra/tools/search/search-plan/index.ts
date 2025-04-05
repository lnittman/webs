import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { loadPromptTemplate, fillTemplate } from "../../../utils/loadPrompt";

const promptTemplate = loadPromptTemplate("tools/search/search-plan/prompt.xml", `
<prompt>
  <task>
    Create a search plan to find comprehensive information about:
    
    {{query}}
  </task>
  
  <guidelines>
    <guideline>Break down the query into its key components</guideline>
    <guideline>Identify primary and secondary topics to research</guideline>
    <guideline>Plan a sequence of searches that builds understanding</guideline>
    <guideline>Consider multiple perspectives and angles</guideline>
    <guideline>Include specialized sources that might have unique information</guideline>
  </guidelines>
  
  <output_format>
    1. First provide a structured outline of search topics
    2. For each topic, provide 2-3 specific search queries
    3. Explain the purpose of each search area
  </output_format>
</prompt>
`);

/**
 * Generates a plan for search terms based on context
 */
export const search_plan = createTool({
  id: "search_plan",
  inputSchema: z.object({
    context: z.string().describe("Current context/knowledge accumulated so far"),
    query: z.string().describe("The original user query"),
    count: z.number().min(1).max(5).default(3).describe("Number of search terms to generate"),
  }),
  description: "Generates ideal search terms based on the current context to guide the next steps in exploration",
  execute: async ({ context }) => {
    try {
      // Fill the prompt template with context
      const prompt = fillTemplate(promptTemplate, {
        context: context.context,
        query: context.query,
        count: context.count
      });

      const { text } = await generateText({
        model: google("gemini-2.0-flash"),
        prompt: prompt
      });

      const jsonStr = text.substring(text.indexOf("["), text.lastIndexOf("]") + 1);
      const searchTerms = JSON.parse(jsonStr);

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