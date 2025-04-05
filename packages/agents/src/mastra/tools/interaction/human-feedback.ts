import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * Collects human input during execution
 */
export const human_feedback_tool = createTool({
  id: "human_feedback",
  inputSchema: z.object({
    prompt: z.string().describe("The question or prompt to ask the human"),
    options: z.array(z.string()).optional().describe("Optional list of suggested response options"),
  }),
  description: "Pauses execution to collect human feedback",
  execute: async ({ context, suspend }) => {
    // Suspend the workflow with the feedback request
    await suspend({
      type: "FEEDBACK_REQUESTED",
      prompt: context.prompt,
      options: context.options || []
    });
    
    // When resumed, the context should contain the user's feedback
    return { 
      feedback: context.userFeedback || "",
      receivedAt: new Date().toISOString()
    };
  },
}); 