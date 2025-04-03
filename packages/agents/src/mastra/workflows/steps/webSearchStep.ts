import { Step } from "@mastra/core/workflows";
import { z } from "zod";
import * as tools from "../../tools";

// Define interface for search web result
interface SearchWebResult {
  urls?: string[];
  snippets?: string[];
  error?: string;
  title?: string;
}

export const webSearchStep = new Step({
  id: "webSearch",
  inputSchema: z.object({
    originalPrompt: z.string(),
    extractedUrls: z.array(z.string()).optional(),
  }),
  execute: async ({ context }) => {
    const prompt = context.inputData.originalPrompt;
    console.log(`[WORKFLOW:webSearch] Searching web for: ${prompt.substring(0, 50)}...`);
    
    try {
      // Check if search_web tool is available
      if (!tools.search_web || !tools.search_web.execute) {
        throw new Error("search_web tool not available");
      }
      
      // Use the search_web tool to find relevant URLs
      const result = await tools.search_web.execute({
        context: {
          query: prompt
        }
      }) as SearchWebResult;
      
      console.log(`[WORKFLOW:webSearch] Found ${result.urls?.length || 0} results for: ${prompt.substring(0, 30)}...`);
      
      // Combine search results with any URLs that were extracted from the prompt
      const extractedUrls = context.inputData.extractedUrls || [];
      const allUrls = [...new Set([...(result.urls || []), ...extractedUrls])];
      
      // Return the search results
      return {
        query: prompt,
        urls: allUrls,
        searchUrls: result.urls || [],
        snippets: result.snippets || [],
        title: prompt,
      };
    } catch (error) {
      console.error(`[WORKFLOW:webSearch] Error searching web: ${error instanceof Error ? error.message : String(error)}`);
      
      // If search fails, still return any extracted URLs
      const extractedUrls = context.inputData.extractedUrls || [];
      
      return {
        query: prompt,
        urls: extractedUrls,
        searchUrls: [],
        snippets: [],
        title: prompt,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}); 