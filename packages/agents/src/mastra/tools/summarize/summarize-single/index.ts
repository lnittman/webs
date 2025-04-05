import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { loadPromptTemplate, fillTemplate } from "../../../utils/loadPrompt";

// @ts-ignore - Ignore version compatibility issues with the AI SDK
const geminiModel = google("gemini-2.0-flash");

// Load the prompt template
const promptTemplate = loadPromptTemplate("tools/summarize/summarize-single/prompt.xml");

/**
 * Summarizes a single page's content
 */
export const summarize_single = createTool({
  id: "summarize_single",
  inputSchema: z.object({
    content: z.string().describe("The content to summarize"),
    url: z.string().optional().describe("The URL of the content"),
    title: z.string().optional().describe("The title of the content"),
  }),
  description: "Summarizes a single page's content using Gemini",
  execute: async ({ context }) => {
    try {
      // Fill the prompt template with context
      const prompt = fillTemplate(promptTemplate, {
        content: context.content,
        url: context.url || '',
        title: context.title || ''
      });
      
      // @ts-ignore - Ignore version compatibility issues with the AI SDK
      const { text } = await generateText({
        model: geminiModel,
        prompt: prompt 
      });

      let summary = text;
      
      // Clean up the response if needed
      if (summary.includes("<answer>")) {
        summary = summary.split("<answer>")[1];
      }
      if (summary.includes("</answer>")) {
        summary = summary.split("</answer>")[0];
      }
      
      summary = summary.trim();

      return { 
        summary,
        url: context.url || '',
        title: context.title || ''
      };
    } catch (error) {
      console.error("Error in summarize_single tool:", error);
      return { 
        summary: "Failed to generate summary",
        url: context.url || '',
        title: context.title || '',
        error: String(error)
      };
    }
  },
}); 