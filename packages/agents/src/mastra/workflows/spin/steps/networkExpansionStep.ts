import { Step } from "@mastra/core/workflows";
import { z } from "zod";
import * as tools from "../../../tools";

// Define interfaces for network expansion
interface NetworkNode {
  url: string;
  title?: string;
  summary?: string;
  connections: string[];
}

interface NetworkExpansionResult {
  nodes: NetworkNode[];
  centralTopic: string;
  relatedTopics: string[];
}

export const networkExpansionStep = new Step({
  id: "networkExpansion",
  inputSchema: z.object({
    urls: z.array(z.string()),
    extractedUrls: z.array(z.string()).optional(),
    maxConnections: z.number().optional().default(5),
    originalPrompt: z.string(),
  }),
  execute: async ({ context }) => {
    const urls = context.inputData.urls;
    const maxConnections = context.inputData.maxConnections || 5;
    const query = context.inputData.originalPrompt;
    
    console.log(`[WORKFLOW:spin:networkExpansion] Expanding network for ${urls.length} URLs`);
    
    if (urls.length === 0) {
      console.log(`[WORKFLOW:spin:networkExpansion] No URLs to expand network`);
      return { 
        nodes: [],
        centralTopic: query,
        relatedTopics: []
      };
    }
    
    // Start building the network
    const networkNodes: NetworkNode[] = [];
    const topics: Set<string> = new Set();
    
    // Process each URL to build the network, but limit to 10 URLs max
    const limitedUrls = urls.slice(0, 10);
    
    for (const url of limitedUrls) {
      console.log(`[WORKFLOW:spin:networkExpansion] Processing node: ${url}`);
      
      try {
        // Crawl the URL to get content
        if (!tools.read_url || !tools.read_url.execute) {
          throw new Error("read_url tool not available");
        }

        const crawlResult = await tools.read_url.execute({ context: { url } });
        
        if (!crawlResult.content) {
          console.log(`[WORKFLOW:spin:networkExpansion] Empty content for ${url}, skipping`);
          continue;
        }
        
        // Summarize the content
        if (!tools.summarize_single || !tools.summarize_single.execute) {
          throw new Error("summarize_single tool not available");
        }
        
        if (!crawlResult.content) {
          console.log(`[WORKFLOW:spin:networkExpansion] Empty content for ${url}, skipping`);
          continue;
        }
        
        // Summarize the content
        if (!tools.summarize_single || !tools.summarize_single.execute) {
          throw new Error("summarize_single tool not available");
        }
        
        const summaryResult = await tools.summarize_single.execute({
          context: {
            content: crawlResult.content,
            url,
            title: crawlResult.title || ""
          }
        });
        
        // Extract key topics from the summary
        if (summaryResult.summary) {
          // Simple topic extraction by looking for capitalized phrases
          const topicMatches = summaryResult.summary.match(/\b[A-Z][a-zA-Z0-9]+(?: [A-Za-z0-9]+){0,3}\b/g) || [];
          topicMatches.forEach(topic => topics.add(topic));
        }
        
        // Find connections to other URLs
        const connections = crawlResult.links || [];
        const limitedConnections = connections
          .filter(link => urls.includes(link))  // Only connect to URLs we know about
          .slice(0, maxConnections);  // Limit connections per node
        
        // Add this node to our network
        networkNodes.push({
          url,
          title: crawlResult.title,
          summary: summaryResult.summary,
          connections: limitedConnections
        });
        
      } catch (error) {
        console.error(`[WORKFLOW:spin:networkExpansion] Error processing ${url}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    console.log(`[WORKFLOW:spin:networkExpansion] Network expanded with ${networkNodes.length} nodes and ${topics.size} topics`);
    
    return {
      nodes: networkNodes,
      centralTopic: query,
      relatedTopics: Array.from(topics).slice(0, 10) // Limit to top 10 topics
    };
  }
}); 