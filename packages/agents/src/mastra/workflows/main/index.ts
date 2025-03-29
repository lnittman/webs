import { Workflow } from "@mastra/core/workflows";
import { z } from "zod";

import * as steps from './steps';

// Create the workflow
export const mainWorkflow = new Workflow({
  name: "main",
  triggerSchema: z.object({
    url: z.string(),
    query: z.string().optional(),
  }),
});

// Set up the workflow steps
mainWorkflow
  .step(steps.initialCrawlStep)
  .then(steps.summarizePageStep)
  .then(steps.extractLinksStep)
  .then(steps.determineRelevantLinksStep, {
    variables: {
      summary: { step: { id: "summarizePage" }, path: "summary" }
    }
  })
  .then(steps.crawlRelatedLinksStep)
  .then(steps.createComprehensiveSummaryStep, {
    variables: {
      summary: { step: { id: "summarizePage" }, path: "summary" },
      url: { step: { id: "initialCrawl" }, path: "url" }
    }
  })
  .commit(); 