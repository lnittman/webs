import { google } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";

import { memory } from "../memory";
import * as tools from "../../tools";
import { loadPromptTemplate } from "../../utils/loadPrompt";

const instructions = loadPromptTemplate("agents/main/instructions.xml");

// Main - Comprehensive web research
export const mainAgent = new Agent({
  name: "Main Agent",
  instructions,
  memory,
  model: google("gemini-2.0-flash"),
  tools: {
    search_web: tools.search_web,
    crawl_single: tools.crawl_single,
    summarize_single: tools.summarize_single,
    summarize_group: tools.summarize_group,
    search_plan: tools.search_plan,
    filter_links: tools.filter_links,
  },
}); 