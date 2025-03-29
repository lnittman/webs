import { Memory } from "@mastra/memory";

// Common memory configuration for all agents
export const memory = new Memory({
  options: {
    lastMessages: 40,
    semanticRecall: {
      topK: 5,
      messageRange: 2,
    },
  },
}); 