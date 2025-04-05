import { Workflow } from "@mastra/core/workflows";
import { z } from "zod";
import * as steps from "./steps";
import * as commonSteps from "../steps";

/**
 * Think workflow - research with human feedback loop
 */
export const thinkWorkflow = new Workflow({
  name: "think",
  triggerSchema: z.object({
    prompt: z.string().describe("The user's query or prompt"),
    threadId: z.string().optional().describe("Thread ID for conversation context"),
    feedbackEnabled: z.boolean().optional().default(true).describe("Whether to enable human feedback"),
  }),
});

// Set up the workflow steps
thinkWorkflow
  // Analyze the input and extract URLs
  .step(steps.analyzeThinkInputStep)
  
  // For any found URLs, crawl the primary one first
  .then(commonSteps.initialCrawlStep, {
    when: async ({ context }) => {
      const analysis = context.getStepResult('analyzeThinkInput');
      return analysis?.extractedUrls?.length > 0;
    }
  })
  
  // Always do a web search to find additional information
  .then(commonSteps.webSearchStep)
  
  // Summarize the crawled page if we have one
  .then(commonSteps.summarizePageStep, {
    when: async ({ context }) => {
      return !!context.getStepResult('initialCrawl')?.content;
    }
  })
  
  // Allow for human feedback on the research approach
  .then(steps.reasoningStep, {
    variables: {
      originalPrompt: { step: { id: 'analyzeThinkInput' }, path: 'originalPrompt' },
      extractedUrls: { step: { id: 'analyzeThinkInput' }, path: 'extractedUrls' },
      feedbackEnabled: { step: { id: 'analyzeThinkInput' }, path: 'feedbackEnabled' },
      threadId: { step: { id: 'analyzeThinkInput' }, path: 'threadId' },
    }
  })
  
  // Synthesize the findings with feedback incorporated
  .then(steps.synthesisStep, {
    variables: {
      originalPrompt: { step: { id: 'analyzeThinkInput' }, path: 'originalPrompt' },
      extractedUrls: { step: { id: 'analyzeThinkInput' }, path: 'extractedUrls' },
      reasoning: { step: { id: 'reasoning' }, path: 'reasoning' },
      feedbackReceived: { step: { id: 'reasoning' }, path: 'feedbackReceived' },
      webSearchResult: { step: { id: 'webSearch' }, path: '' },
      summarizedResults: { step: { id: 'summarizePage' }, path: '' },
      threadId: { step: { id: 'analyzeThinkInput' }, path: 'threadId' },
    }
  })
  .commit();

// Export the workflow
export default thinkWorkflow;
