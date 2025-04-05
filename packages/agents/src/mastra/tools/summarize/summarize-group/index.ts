import { google } from "@ai-sdk/google";
import { createTool } from "@mastra/core/tools";
import { generateText } from "ai";
import { z } from "zod";
import { loadPromptTemplate, fillTemplate } from "../../../utils/loadPrompt";

// Load the prompt template
const promptTemplate = loadPromptTemplate("tools/summarize/summarize-group/prompt.xml", `
<prompt>
  <task>
    Group the following summaries into logical topics and create a summary for each group:
    
    {{summaries}}
    
    The query is: {{query}}
  </task>
  
  <guidelines>
    <guideline>Identify common themes or topics among the summaries</guideline>
    <guideline>Group related summaries together</guideline>
    <guideline>Create 2-5 logical groups (as appropriate)</guideline>
    <guideline>Give each group a descriptive name</guideline>
    <guideline>Write a concise summary for each group</guideline>
    <guideline>Focus on information relevant to the original query</guideline>
    <guideline>Identify key insights that emerge from each grouping</guideline>
  </guidelines>
  
  <output_format>
    For each group, provide:
    1. A clear topic/group name
    2. A list of sources in this group
    3. A concise summary of the group's content
    4. 3-5 key points or insights from this group
  </output_format>
</prompt>
`);

/**
 * Summarizes a group of related pages
 */
export const summarize_group = createTool({
  id: "summarize_group",
  inputSchema: z.object({
    summaries: z.array(z.object({
      summary: z.string(),
      url: z.string().optional(),
      title: z.string().optional(),
    })).describe("Array of page summaries to synthesize"),
    groupName: z.string().optional().describe("Name or theme of the group"),
  }),
  description: "Summarizes a logical grouping of pages",
  execute: async ({ context }) => {
    try {
      // Create a combined text of all summaries with their sources
      const combinedText = context.summaries.map(item => 
        `Source: ${item.title || item.url || "Unknown"}
        Summary: ${item.summary}
        `
      ).join("\n\n");

      // Format summaries for template
      const summariesText = combinedText;

      // Fill the prompt template with context
      const prompt = fillTemplate(promptTemplate, {
        summariesText,
        groupName: context.groupName || "Related pages"
      });

      const { text } = await generateText({
        model: google("gemini-2.0-flash"),
        prompt
      });

      let groupSummary = text;
      
      return { 
        groupSummary: groupSummary.trim(),
        groupName: context.groupName || "Related pages",
        sourceCount: context.summaries.length
      };
    } catch (error) {
      console.error("Error in summarize_group tool:", error);
      return { 
        groupSummary: "Failed to generate group summary",
        groupName: context.groupName || "Related pages",
        sourceCount: context.summaries.length,
        error: String(error)
      };
    }
  },
}); 