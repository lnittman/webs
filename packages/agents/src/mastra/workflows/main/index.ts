import { Workflow } from "@mastra/core/workflows";
import { z } from "zod";

import * as steps from './steps';
import { loadPromptTemplate } from '../../utils/loadPrompt';

// Create the workflow
export const mainWorkflow = new Workflow({
  name: "main",
  triggerSchema: z.object({
    // User's input (can be prompt text or URL)
    prompt: z.string().min(1),
    // Optional ID for memory/conversation thread
    threadId: z.string().optional(),
    // Optional ID for user/resource
    resourceId: z.string().optional(),
    // Optional parameter to limit crawl depth
    maxDepth: z.number().min(1).max(5).default(3).optional(),
    // Optional parameter to enable/disable feedback
    feedbackEnabled: z.boolean().default(true).optional(),
  }),
});

// Set up the workflow steps
mainWorkflow
  // Analyze the input and extract URLs
  .step(steps.analyzeInputStep)
  
  // For any found URLs, crawl the primary one first
  .then(steps.initialCrawlStep, {
    when: async ({ context }) => {
      const analysis = context.getStepResult('analyzeInput');
      return analysis?.extractedUrls?.length > 0;
    }
  })
  
  // Always do a web search to find additional information
  .then(steps.webSearchStep)
  
  // Summarize the crawled page if we have one
  .then(steps.summarizePageStep, {
    when: async ({ context }) => {
      return !!context.getStepResult('initialCrawl')?.content;
    }
  })
  
  // Extract links from the crawled page
  .then(steps.extractLinksStep, {
    when: async ({ context }) => {
      return !!context.getStepResult('initialCrawl')?.content;
    }
  })
  
  // Determine which links are relevant to explore
  .then(steps.determineRelevantLinksStep, {
    when: async ({ context }) => {
      return !!context.getStepResult('extractLinks');
    },
    variables: {
      summary: { step: { id: 'summarizePage' }, path: 'summary' }
    }
  })
  
  // Crawl related links to gather more information
  .then(steps.crawlRelatedLinksStep, {
    when: async ({ context }) => {
      const relevantLinks = context.getStepResult('determineRelevantLinks')?.relevantLinks;
      return Array.isArray(relevantLinks) && relevantLinks.length > 0;
    }
  })
  
  // Create a comprehensive summary from all the gathered information
  .then(steps.createComprehensiveSummaryStep, {
    when: async ({ context }) => {
      return !!context.getStepResult('summarizePage') && 
             !!context.getStepResult('crawlRelatedLinks');
    },
    variables: {
      summary: { step: { id: 'summarizePage' }, path: 'summary' },
      url: { step: { id: 'initialCrawl' }, path: 'url' }
    }
  })
  
  // Generate the final response
  .then(steps.generateFinalResponseStep)
  .commit();

// Export the workflow
export default mainWorkflow; 