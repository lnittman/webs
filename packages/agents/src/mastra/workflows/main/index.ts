import { Workflow } from "@mastra/core/workflows";
import { z } from "zod";

import * as steps from './steps';
import * as commonSteps from '../steps';

// Create the workflow
export const mainWorkflow = new Workflow({
  name: "main",
  triggerSchema: z.object({
    prompt: z.string().min(1).describe("The user's query or prompt"),
    threadId: z.string().optional().describe("Thread ID for conversation context"),
    resourceId: z.string().optional().describe("Optional ID for user/resource"),
    maxDepth: z.number().min(1).max(5).default(3).optional().describe("Maximum crawl depth"),
    feedbackEnabled: z.boolean().default(true).optional().describe("Enable/disable feedback"),
  }),
});

mainWorkflow
  // Analyze the input and extract URLs
  .step(steps.analyzeInputStep, {
    onStart: async ({ stepId }) => {
      console.log(`[WORKFLOW:main] Started ${stepId}: Analyzing input to extract URLs`);
    },
    onComplete: async ({ stepId, result }) => {
      console.log(`[WORKFLOW:main] Completed ${stepId}: Found ${result?.extractedUrls?.length || 0} URLs`);
    }
  })
  
  // For any found URLs, crawl the primary one first
  .then(steps.initialCrawlStep, {
    when: async ({ context }) => {
      const analysis = context.getStepResult('analyzeInput');
      return analysis?.extractedUrls?.length > 0;
    },
    onStart: async ({ stepId, context }) => {
      const urls = context.getStepResult('analyzeInput')?.extractedUrls || [];
      console.log(`[WORKFLOW:main] Started ${stepId}: Crawling primary URL from ${urls.length} extracted URLs`);
    },
    onComplete: async ({ stepId, result }) => {
      console.log(`[WORKFLOW:main] Completed ${stepId}: Retrieved ${result?.content?.length || 0} bytes of content from ${result?.url || 'unknown URL'}`);
    }
  })
  
  // If no URLs were directly provided, perform a web search to find relevant content
  .then(commonSteps.webSearchStep, {
    onStart: async ({ stepId, context }) => {
      const prompt = context.getStepResult('analyzeInput')?.originalPrompt;
      console.log(`[WORKFLOW:main] Started ${stepId}: Searching for relevant information related to "${prompt?.substring(0, 30)}..."`);
    },
    onComplete: async ({ stepId, result }) => {
      console.log(`[WORKFLOW:main] Completed ${stepId}: Found ${result?.urls?.length || 0} search results`);
    }
  })
  
  // Summarize the crawled page if we have one
  .then(commonSteps.summarizePageStep, {
    when: async ({ context }) => {
      return !!context.getStepResult('initialCrawl')?.content;
    },
    onStart: async ({ stepId }) => {
      console.log(`[WORKFLOW:main] Started ${stepId}: Summarizing crawled page content`);
    },
    onComplete: async ({ stepId, result }) => {
      const summaryLength = result?.summary?.length || 0;
      console.log(`[WORKFLOW:main] Completed ${stepId}: Generated summary of ${summaryLength} characters`);
    }
  })
  
  // Extract links from the crawled page for further exploration
  .then(steps.extractLinksStep, {
    when: async ({ context }) => {
      return !!context.getStepResult('initialCrawl')?.content;
    },
    onStart: async ({ stepId }) => {
      console.log(`[WORKFLOW:main] Started ${stepId}: Extracting links from crawled content`);
    },
    onComplete: async ({ stepId, result }) => {
      console.log(`[WORKFLOW:main] Completed ${stepId}: Extracted ${result?.extractedLinks?.length || 0} links from content`);
    }
  })
  
  // Determine which links are most relevant to explore based on user prompt
  .then(steps.determineRelevantLinksStep, {
    when: async ({ context }) => {
      return !!context.getStepResult('extractLinks');
    },
    variables: {
      summary: { step: { id: 'summarizePage' }, path: 'summary' }
    },
    onStart: async ({ stepId, context }) => {
      const links = context.getStepResult('extractLinks')?.extractedLinks || [];
      console.log(`[WORKFLOW:main] Started ${stepId}: Analyzing relevance of ${links.length} extracted links`);
    },
    onComplete: async ({ stepId, result }) => {
      console.log(`[WORKFLOW:main] Completed ${stepId}: Identified ${result?.relevantLinks?.length || 0} relevant links for deeper exploration`);
    }
  })
  
  // Crawl related links to gather more comprehensive information
  .then(steps.crawlRelatedLinksStep, {
    when: async ({ context }) => {
      const relevantLinks = context.getStepResult('determineRelevantLinks')?.relevantLinks;
      return Array.isArray(relevantLinks) && relevantLinks.length > 0;
    },
    onStart: async ({ stepId, context }) => {
      const relevantLinks = context.getStepResult('determineRelevantLinks')?.relevantLinks || [];
      console.log(`[WORKFLOW:main] Started ${stepId}: Crawling ${relevantLinks.length} related links for additional content`);
    },
    onComplete: async ({ stepId, result }) => {
      const successfulCrawls = result?.results?.filter(r => !r.error).length || 0;
      const totalCrawls = result?.results?.length || 0;
      console.log(`[WORKFLOW:main] Completed ${stepId}: Successfully crawled ${successfulCrawls}/${totalCrawls} related links`);
    }
  })
  
  // Create individual summaries for each crawled page
  .then(steps.summarizeIndividualPagesStep, {
    when: async ({ context }) => {
      const crawlResults = context.getStepResult('crawlRelatedLinks')?.results || [];
      return crawlResults.length > 0;
    },
    onStart: async ({ stepId, context }) => {
      const crawlResults = context.getStepResult('crawlRelatedLinks')?.results || [];
      console.log(`[WORKFLOW:main] Started ${stepId}: Creating individual summaries for ${crawlResults.length} crawled pages`);
    },
    onComplete: async ({ stepId, result }) => {
      console.log(`[WORKFLOW:main] Completed ${stepId}: Generated ${result?.summaries?.length || 0} individual page summaries`);
    }
  })
  
  // Group related summaries by topic for better organization
  .then(steps.groupRelatedSummariesStep, {
    when: async ({ context }) => {
      const summaries = context.getStepResult('summarizeIndividualPages')?.summaries || [];
      return summaries.length > 1; // Only group if we have multiple summaries
    },
    onStart: async ({ stepId }) => {
      console.log(`[WORKFLOW:main] Started ${stepId}: Grouping related summaries by topic`);
    },
    onComplete: async ({ stepId, result }) => {
      console.log(`[WORKFLOW:main] Completed ${stepId}: Created ${result?.groups?.length || 0} logical groups of related content`);
    }
  })
  
  // Create a comprehensive summary from all the gathered information
  .then(steps.createComprehensiveSummaryStep, {
    variables: {
      summary: { step: { id: 'summarizePage' }, path: 'summary' },
      url: { step: { id: 'initialCrawl' }, path: 'url' },
      individualSummaries: { step: { id: 'summarizeIndividualPages' }, path: 'summaries' },
      groupedSummaries: { step: { id: 'groupRelatedSummaries' }, path: 'groups' }
    },
    onStart: async ({ stepId }) => {
      console.log(`[WORKFLOW:main] Started ${stepId}: Creating comprehensive synthesis of all gathered information`);
    },
    onComplete: async ({ stepId, result }) => {
      const summaryLength = result?.comprehensiveSummary?.length || 0;
      console.log(`[WORKFLOW:main] Completed ${stepId}: Generated comprehensive summary of ${summaryLength} characters`);
    }
  })
  
  // Generate the final response
  .then(steps.generateFinalResponseStep, {
    onStart: async ({ stepId }) => {
      console.log(`[WORKFLOW:main] Started ${stepId}: Generating final response for user`);
    },
    onComplete: async ({ stepId, result }) => {
      const responseLength = result?.response?.length || 0;
      console.log(`[WORKFLOW:main] Completed ${stepId}: Generated final response of ${responseLength} characters with ${result?.sources?.length || 0} sources`);
    }
  })
  .commit();

// Export the workflow
export default mainWorkflow; 