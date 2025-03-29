import { Step } from "@mastra/core/workflows";
import { z } from "zod";
import extractLinks from "../../../utils/extractLinks";

export const extractLinksStep = new Step({
  id: "extractLinks",
  inputSchema: z.object({
    content: z.string(),
    links: z.array(z.string()).optional(),
    url: z.string(),
    query: z.string().optional(),
  }),
  execute: async ({ context }) => {
    console.log(`[WORKFLOW:extractLinks] Processing: ${context.inputData.url}`);
    // Extract URLs from the content and links array
    const linksFromArray = context.inputData.links || [];
    
    // If we don't have links from the array, extract from content
    let extractedLinks = linksFromArray;
    if (extractedLinks.length === 0) {
      console.log(`[WORKFLOW:extractLinks] No provided links, extracting from content`);
      extractedLinks = extractLinks(context.inputData.content, context.inputData.url);
    }
    
    // Filter links to make sure they're valid URLs
    const validLinks = extractedLinks.filter(link => {
      try {
        new URL(link);
        return true;
      } catch {
        return false;
      }
    });
    
    console.log(`[WORKFLOW:extractLinks] Found ${validLinks.length} valid links for: ${context.inputData.url}`);
    
    return { 
      extractedLinks: validLinks, 
      sourceUrl: context.inputData.url,
      originalQuery: context.inputData.query || ""
    };
  }
}); 