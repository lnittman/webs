import { Memory } from "@mastra/memory";
import { UpstashStore } from "@mastra/upstash";

// Common memory configuration for all agents
export const memory = new Memory({
  storage: new UpstashStore({
    url: process.env.KV_REST_API_URL || '',
    token: process.env.KV_REST_API_TOKEN || '',
  }),
  // Explicitly set vector to null/undefined to avoid any potential libsql dependency
  vector: undefined, // This ensures we don't load any vector store implementation
  // Explicitly disable embedder to avoid any potential dependency issues
  embedder: undefined, // This prevents loading any embedding models
  // Memory configuration options
  options: {
    lastMessages: 40,
    // Disable semantic recall since it requires vector storage
    semanticRecall: false,
    // We're not using workingMemory yet, but it's available when needed
    workingMemory: {
      enabled: false,
    },
  },
}); 