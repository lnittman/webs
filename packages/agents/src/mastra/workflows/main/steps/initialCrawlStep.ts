import { Step } from "@mastra/core/workflows";
import { z } from "zod";
import * as tools from "../../../tools";

export const initialCrawlStep = new Step({
  id: "initialCrawl",
  inputSchema: z.object({
    url: z.string(),
  }),
  execute: async ({ context }) => {
    console.log(`[WORKFLOW:initialCrawl] Starting for: ${context.inputData.url}`);
    if (tools.crawl_single && tools.crawl_single.execute) {
      const result = await tools.crawl_single.execute({ 
        context: { 
          url: context.inputData.url 
        } 
      });
      console.log(`[WORKFLOW:initialCrawl] Completed for: ${context.inputData.url}`);
      return result;
    }
    throw new Error("crawl_single tool not available");
  }
}); 