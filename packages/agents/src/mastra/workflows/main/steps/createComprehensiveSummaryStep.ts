import { Step } from "@mastra/core/workflows";
import { z } from "zod";

import * as tools from "../../../tools";

interface SummarizeGroupResult {
  groupSummary: string;
  sourceCount: number;
}

export const createComprehensiveSummaryStep = new Step({
  id: "createComprehensiveSummary",
  inputSchema: z.object({
    summary: z.string(),
    relatedResults: z.array(z.object({
      url: z.string(),
      title: z.string().optional(),
      summary: z.string(),
    })),
    url: z.string(),
  }),
  execute: async ({ context }) => {
    console.log(`[WORKFLOW:createComprehensiveSummary] Creating summary for ${context.inputData.url} with ${context.inputData.relatedResults.length} related pages`);
    
    // Combine main page summary with related page summaries
    const allSummaries = [
      {
        url: context.inputData.url,
        summary: context.inputData.summary,
        title: "Main page"
      },
      ...context.inputData.relatedResults
    ];
    
    // Check if summarize_group tool is available
    if (!tools.summarize_group || typeof tools.summarize_group.execute !== 'function') {
      throw new Error("summarize_group tool not available or not properly configured");
    }
    
    // Use the summarize_group tool to create a comprehensive summary
    const result = await tools.summarize_group.execute({ 
      context: {
        summaries: allSummaries,
        groupName: `Information from ${context.inputData.url} and related pages`
      } 
    }) as SummarizeGroupResult;
    
    console.log(`[WORKFLOW:createComprehensiveSummary] Completed summary (${result.sourceCount} sources)`);
    
    return {
      comprehensiveSummary: result.groupSummary,
      sourceCount: result.sourceCount,
      sources: allSummaries.map(s => s.url),
    };
  }
}); 