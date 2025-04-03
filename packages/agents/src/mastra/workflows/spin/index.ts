import { Workflow } from "@mastra/core/workflows";
import { z } from "zod";

// Import common steps directly
import { initialCrawlStep, webSearchStep, extractLinksStep } from '../steps';

// Import spin-specific steps
import * as spinSteps from './steps';

// Create the spin workflow
export const spinWorkflow = new Workflow({
  name: "spin",
  triggerSchema: z.object({
    // User's input (can be prompt text or URL)
    prompt: z.string().min(1),
    // Optional ID for memory/conversation thread
    threadId: z.string().optional(),
    // Optional ID for user/resource
    resourceId: z.string().optional(),
    // Optional parameter to limit breadth 
    maxBreadth: z.number().min(1).max(10).default(5).optional(),
    // Optional parameter to limit iterations
    maxIterations: z.number().min(1).max(3).default(2).optional(),
  }),
});

// Set up the workflow steps for a breadth-first exploration of related content
spinWorkflow
  // Analyze the input with spin-specific instructions
  .step(spinSteps.analyzeSpinInputStep)
  
  // Initial crawl of any URLs in the prompt
  .then(initialCrawlStep, {
    when: async ({ context }) => {
      const analysis = context.getStepResult('analyzeSpinInput');
      return analysis?.extractedUrls?.length > 0;
    }
  })
  
  // Do a web search to find initial set of related content
  .then(webSearchStep)
  
  // Extract links from all sources
  .then(extractLinksStep, {
    when: async ({ context }) => {
      return !!context.getStepResult('initialCrawl')?.content;
    }
  })
  
  // Expand the network by analyzing the connections between resources
  // This is the key step that distinguishes the spin workflow
  .then(spinSteps.networkExpansionStep, {
    when: async ({ context }) => {
      // Only do network expansion if we have URLs from either the web search or crawl
      const webSearchResult = context.getStepResult('webSearch');
      const extractLinksResult = context.getStepResult('extractLinks');
      
      return (webSearchResult?.urls?.length > 0) || 
             (extractLinksResult?.extractedLinks?.length > 0);
    },
    variables: {
      urls: { step: { id: 'webSearch' }, path: 'urls' },
      extractedUrls: { step: { id: 'extractLinks' }, path: 'extractedLinks' },
      originalPrompt: { step: { id: 'analyzeSpinInput' }, path: 'originalPrompt' }
    }
  })
  
  // Generate a network-oriented response that highlights the connections
  .then(spinSteps.generateNetworkResponseStep, {
    when: async ({ context }) => {
      // Only generate network response if we have network nodes
      const networkResult = context.getStepResult('networkExpansion');
      return networkResult?.nodes?.length > 0;
    },
    variables: {
      originalPrompt: { step: { id: 'analyzeSpinInput' }, path: 'originalPrompt' },
      nodes: { step: { id: 'networkExpansion' }, path: 'nodes' },
      centralTopic: { step: { id: 'networkExpansion' }, path: 'centralTopic' },
      relatedTopics: { step: { id: 'networkExpansion' }, path: 'relatedTopics' },
      instructions: { step: { id: 'analyzeSpinInput' }, path: 'instructions' }
    }
  })
  .commit();

// Export the workflow
export default spinWorkflow;
