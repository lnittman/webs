import { Step } from "@mastra/core/workflows";
import { z } from "zod";

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
    
    // If we have links already, just use those
    let extractedLinks = linksFromArray;
    
    // Otherwise, try to extract them from the content
    if (extractedLinks.length === 0 && context.inputData.content) {
      console.log(`[WORKFLOW:extractLinks] No provided links, extracting from content`);
      
      // Simple URL extraction from content
      const urlRegex = /(https?:\/\/[^\s"'<>]+)/g;
      const matches = [...(context.inputData.content.match(urlRegex) || [])];
      
      // Add any found links
      if (matches.length > 0) {
        extractedLinks = [...matches];
      }
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