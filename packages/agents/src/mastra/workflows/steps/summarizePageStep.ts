import { Step } from "@mastra/core/workflows";
import { z } from "zod";
import * as tools from "../../tools";

export const summarizePageStep = new Step({
  id: "summarizePage",
  inputSchema: z.object({
    content: z.string(),
    url: z.string(),
    title: z.string().optional(),
  }),
  execute: async ({ context }) => {
    console.log(`[WORKFLOW:summarizePage] Summarizing: ${context.inputData.url}`);
    
    try {
      if (!tools.summarize_single || !tools.summarize_single.execute) {
        throw new Error("summarize_single tool not available");
      }
      
      const result = await tools.summarize_single.execute({ 
        context: {
          content: context.inputData.content,
          url: context.inputData.url,
          title: context.inputData.title || ""
        } 
      });
      
      console.log(`[WORKFLOW:summarizePage] Completed for: ${context.inputData.url}`);
      return result;
    } catch (error) {
      console.error(`[WORKFLOW:summarizePage] Error: ${error instanceof Error ? error.message : String(error)}`);
      return {
        summary: `Failed to summarize ${context.inputData.url}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}); 