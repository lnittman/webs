import { Step } from "@mastra/core/workflows";
import { z } from "zod";
import * as tools from "../../../tools";

// Define feedback result interface
interface FeedbackResult {
  feedback?: string;
  receivedAt?: string;
}

export const reasoningStep = new Step({
  id: "reasoning",
  inputSchema: z.object({
    originalPrompt: z.string(),
    extractedUrls: z.array(z.string()).optional(),
    reasoning: z.string().optional(),
    threadId: z.string().optional(),
    feedbackEnabled: z.boolean().optional().default(true),
  }),
  execute: async ({ context, suspend }) => {
    console.log(`[WORKFLOW:think:reasoning] Reasoning about approach for: ${context.inputData.originalPrompt.substring(0, 50)}...`);
    
    const prompt = context.inputData.originalPrompt;
    const extractedUrls = context.inputData.extractedUrls || [];
    const initialReasoning = context.inputData.reasoning || '';
    const threadId = context.inputData.threadId;
    const feedbackEnabled = context.inputData.feedbackEnabled !== false;
    
    // Get human feedback if enabled and tools are available
    let searchPlanningFeedback: FeedbackResult | null = null;
    
    if (feedbackEnabled && threadId) {
      try {
        if (tools.human_feedback_tool && tools.human_feedback_tool.execute) {
          console.log(`[WORKFLOW:think:reasoning] Requesting human feedback`);
          
          // Use the human feedback tool which will handle the suspension internally
          const feedbackResponse = await tools.human_feedback_tool.execute({
            context: {
              prompt: "I'm planning my research approach. Would you like to suggest any specific aspects to focus on?",
              options: ["Proceed with your plan", "I'd like you to focus more on...", "Could you prioritize exploring..."],
              timeoutSeconds: 300, // 5-minute timeout
            },
            threadId
          }) as { feedback?: string; receivedAt?: string };
          
          if (feedbackResponse) {
            searchPlanningFeedback = {
              feedback: feedbackResponse.feedback || '',
              receivedAt: feedbackResponse.receivedAt || new Date().toISOString()
            };
            console.log(`[WORKFLOW:think:reasoning] Received feedback: ${searchPlanningFeedback.feedback}`);
          }
        } else {
          console.error(`[WORKFLOW:think:reasoning] Human feedback tool not available`);
        }
      } catch (error) {
        console.error(`[WORKFLOW:think:reasoning] Error getting feedback: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      console.log(`[WORKFLOW:think:reasoning] Feedback disabled or missing threadId, skipping request`);
    }
    
    // Format the feedback and integrate it into the reasoning
    let enhancedReasoning = initialReasoning;
    
    if (searchPlanningFeedback?.feedback && 
        searchPlanningFeedback.feedback !== "Proceed with your plan") {
      enhancedReasoning += `\n\n## Feedback Integration\nBased on your feedback to "${searchPlanningFeedback.feedback}", I'll adjust my approach to emphasize these aspects.`;
    }
    
    return {
      reasoning: enhancedReasoning,
      searchPlanningFeedback: searchPlanningFeedback?.feedback,
      feedbackReceived: !!searchPlanningFeedback?.feedback
    };
  }
}); 