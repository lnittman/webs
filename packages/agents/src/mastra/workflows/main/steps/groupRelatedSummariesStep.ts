import { Step } from "@mastra/core/workflows";
import { z } from "zod";
import { summarize_group } from "../../../tools/summarize/summarize-group";

export const groupRelatedSummariesStep = new Step({
  id: "groupRelatedSummaries",
  execute: async ({ context }) => {
    console.log(`[WORKFLOW:groupRelatedSummaries] Grouping summaries by topic`);
    
    // Get summaries from the previous step
    const summaries = context.getStepResult('summarizeIndividualPages')?.summaries || [];
    const originalPrompt = context.getStepResult('analyzeInput')?.originalPrompt || '';
    
    if (summaries.length <= 1) {
      console.log(`[WORKFLOW:groupRelatedSummaries] Not enough summaries to group (${summaries.length})`);
      return { 
        groups: [],
        prompt: originalPrompt
      };
    }
    
    console.log(`[WORKFLOW:groupRelatedSummaries] Analyzing ${summaries.length} summaries for grouping`);
    
    try {
      // Use summarize_group tool to analyze and group summaries
      const result = await summarize_group.execute({
        context: {
          summaries: summaries.map(s => ({
            url: s.url,
            title: s.title,
            summary: s.summary,
            key_points: s.key_points
          })),
          query: originalPrompt,
          max_groups: Math.min(5, Math.ceil(summaries.length / 2)) // Dynamic number of groups
        }
      });
      
      console.log(`[WORKFLOW:groupRelatedSummaries] Created ${result.groups.length} logical groups`);
      
      // Format the result with metadata
      return {
        groups: result.groups,
        topicMap: result.topic_map,
        prompt: originalPrompt
      };
    } catch (error) {
      console.error(`[WORKFLOW:groupRelatedSummaries] Error grouping summaries: ${error}`);
      
      // Return a simple fallback grouping (all in one group)
      return {
        groups: [{
          topic: "All Content",
          sources: summaries.map(s => s.url),
          summaries: summaries.map(s => s.summary).join("\n\n"),
          key_points: []
        }],
        error: error instanceof Error ? error.message : String(error),
        prompt: originalPrompt
      };
    }
  }
});