import { Step } from "@mastra/core/workflows";
import { z } from "zod";
import { summarize_all } from "../../../tools/summarize/summarize-all";

interface SummaryItem {
  url: string;
  title: string;
  summary: string;
  key_points?: string[];
}

interface GroupItem {
  topic: string;
  sources: string[];
  summaries: string;
  key_points?: string[];
}

export const createComprehensiveSummaryStep = new Step({
  id: "createComprehensiveSummary",
  inputSchema: z.object({
    summary: z.string().optional(),
    url: z.string().optional(),
    individualSummaries: z.array(z.any()).optional(),
    groupedSummaries: z.array(z.any()).optional(),
  }),
  execute: async ({ context }) => {
    console.log(`[WORKFLOW:createComprehensiveSummary] Creating comprehensive summary`);
    
    // Get data from different sources
    const mainSummary = context.inputData.summary;
    const mainUrl = context.inputData.url;
    
    // Get related content data
    const crawlResults = context.getStepResult('crawlRelatedLinks')?.results || [];
    const individualSummaries = context.getStepResult('summarizeIndividualPages')?.summaries || context.inputData.individualSummaries || [];
    const groupedSummaries = context.getStepResult('groupRelatedSummaries')?.groups || context.inputData.groupedSummaries || [];
    
    // Get the original prompt
    const originalPrompt = context.getStepResult('analyzeInput')?.originalPrompt || '';
    
    // Collect all available content
    let allContent = "";
    const sources: string[] = [];
    
    // Add the main summary if available
    if (mainSummary && mainUrl) {
      allContent += `# Main Content Summary\n${mainSummary}\n\n`;
      sources.push(mainUrl);
    }
    
    // Add individual summaries if available
    if (individualSummaries && individualSummaries.length > 0) {
      allContent += `# Individual Page Summaries\n\n`;
      individualSummaries.forEach((summary: SummaryItem) => {
        allContent += `## ${summary.title}\n${summary.summary}\n\n`;
        if (summary.url && !sources.includes(summary.url)) {
          sources.push(summary.url);
        }
      });
    }
    
    // Add grouped summaries if available
    if (groupedSummaries && groupedSummaries.length > 0) {
      allContent += `# Topic Groups\n\n`;
      groupedSummaries.forEach((group: GroupItem) => {
        allContent += `## ${group.topic}\n${group.summaries}\n\n`;
        if (group.sources) {
          group.sources.forEach(url => {
            if (!sources.includes(url)) {
              sources.push(url);
            }
          });
        }
      });
    }
    
    // If crawl results have content but no summaries, use them directly
    if (crawlResults.length > 0 && individualSummaries.length === 0) {
      allContent += `# Additional Content\n\n`;
      crawlResults.forEach(crawl => {
        if (crawl && crawl.content && crawl.url) {
          // Take a brief excerpt from each crawl
          const excerpt = crawl.content.substring(0, 500) + (crawl.content.length > 500 ? '...' : '');
          allContent += `## ${crawl.title || crawl.url}\n${excerpt}\n\n`;
          if (!sources.includes(crawl.url)) {
            sources.push(crawl.url);
          }
        }
      });
    }
    
    // If we don't have anything to summarize, return early
    if (!allContent.trim()) {
      console.log(`[WORKFLOW:createComprehensiveSummary] No content to summarize`);
      return {
        comprehensiveSummary: "No content available to summarize.",
        sources: []
      };
    }
    
    console.log(`[WORKFLOW:createComprehensiveSummary] Summarizing content from ${sources.length} sources`);
    
    try {
      // Use the summarize_all tool to create a comprehensive summary
      const result = await summarize_all.execute({
        context: {
          content: allContent,
          query: originalPrompt,
          max_length: 2000
        }
      });
      
      console.log(`[WORKFLOW:createComprehensiveSummary] Generated comprehensive summary (${result.summary.length} chars)`);
      
      return {
        comprehensiveSummary: result.summary,
        key_points: result.key_points,
        sources
      };
    } catch (error) {
      console.error(`[WORKFLOW:createComprehensiveSummary] Error: ${error instanceof Error ? error.message : String(error)}`);
      
      // Provide a fallback summary
      return {
        comprehensiveSummary: `The gathered information addresses "${originalPrompt}". Multiple sources were consulted but could not be synthesized into a comprehensive summary. Please review the individual summaries for details.`,
        sources,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}); 