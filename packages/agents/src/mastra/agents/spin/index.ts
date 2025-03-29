import { google } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";

import * as tools from "../../tools";
import { loadPromptTemplate } from "../../utils/loadPrompt";

const instructions = loadPromptTemplate("agents/spin/instructions.xml");

// Spin - Multi-layered exploration
export const spinAgent = new Agent({
  name: "Spin Agent",
  instructions,
  model: google("gemini-2.0-flash"),
  tools: {
    search_web: tools.search_web,
    crawl_single: tools.crawl_single,
    summarize_single: tools.summarize_single,
    summarize_group: tools.summarize_group,
    summarize_crawl: tools.summarize_crawl,
    search_plan: tools.search_plan,
  },
}); 