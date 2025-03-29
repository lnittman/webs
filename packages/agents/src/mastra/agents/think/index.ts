import { Agent } from "@mastra/core/agent";
import { google } from "@ai-sdk/google";
import * as tools from "../../tools";
import { loadPromptTemplate } from "../../utils/loadPrompt";

const instructions = loadPromptTemplate("agents/instructions/think.xml");

// Think - Deep analysis with HIL feedback
export const thinkAgent = new Agent({
  name: "Think Agent",
  instructions,
  model: google("gemini-2.0-flash-thinking"),
  tools: {
    crawl_website: tools.crawl_website,
    summarize_single: tools.summarize_single,
    summarize_group: tools.summarize_group,
    summarize_crawl: tools.summarize_crawl,
    human_feedback_tool: tools.human_feedback_tool,
  },
}); 