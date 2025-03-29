import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { loadPromptTemplate, fillTemplate } from "../../utils/loadPrompt";

// @ts-ignore - Ignore version compatibility issues with the AI SDK
const geminiModel = google("gemini-2.0-flash");

// Load the prompt template
const promptTemplate = loadPromptTemplate(
  "tools/prompts/summarization/summarize_single.xml",
  // Fallback prompt if the file can't be loaded
  `<?xml version="1.0" encoding="UTF-8"?>
  <prompt>
    <metadata>
      <tool_id>summarize_single</tool_id>
      <prompt_version>1.0</prompt_version>
      <purpose>Create a concise summary of a single page's content.</purpose>
    </metadata>
    <task>
      <objective>Provide a concise summary of the content in 2-3 sentences, capturing the main ideas and key details.</objective>
    </task>
    <context>
      <content_source>{{title}}</content_source>
      <content_url>{{url}}</content_url>
      <content>{{content}}</content>
    </context>
    <instructions>
      <step>Identify the main topic and key points from the content.</step>
      <step>Focus on the most important information, ignoring minor details.</step>
      <step>Synthesize into 2-3 clear, informative sentences.</step>
    </instructions>
    <constraints>
      <rule>Use only 2-3 sentences in total.</rule>
      <rule>Focus only on the most important information.</rule>
      <avoid>Subjective opinions or evaluations.</avoid>
      <avoid>Information not present in the original content.</avoid>
    </constraints>
    <output_format>
      <description>Plain text summary within &lt;answer&gt;...&lt;/answer&gt; tags.</description>
      <requirement>Only include the summary text within the tags, no additional commentary.</requirement>
    </output_format>
  </prompt>`
);

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
      const filledPrompt = fillTemplate(promptTemplate, {
        content: context.content,
        url: context.url || '',
        title: context.title || ''
      });
      
      // @ts-ignore - Ignore version compatibility issues with the AI SDK
      const { text } = await generateText({
        model: geminiModel,
        prompt: filledPrompt
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