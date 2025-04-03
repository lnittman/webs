import { Step } from "@mastra/core/workflows";
import { z } from "zod";
import { loadPromptTemplate } from "../../../utils/loadPrompt";
import { extractUrls } from "../../steps/extractUrls";

// Load spin-specific instructions
const spinInstructions = loadPromptTemplate("agents/spin/instructions.xml", "");

export const analyzeSpinInputStep = new Step({
  id: "analyzeSpinInput",
  inputSchema: z.object({
    prompt: z.string(),
  }),
  execute: async ({ context }) => {
    console.log(`[WORKFLOW:spin:analyzeInput] Analyzing input for network exploration: ${context.inputData.prompt.substring(0, 50)}...`);
    
    const prompt = context.inputData.prompt.trim();
    
    // Extract URLs from the prompt
    const extractedUrls = extractUrls(prompt);
    
    console.log(`[WORKFLOW:spin:analyzeInput] Extracted ${extractedUrls.length} URLs from prompt`);
    
    return {
      originalPrompt: prompt,
      extractedUrls,
      instructions: spinInstructions,
      // Set the primary URL if exactly one was found
      primaryUrl: extractedUrls.length === 1 ? extractedUrls[0] : undefined,
      // Spin mode specific
      exploreDepth: 2,  // Default depth to explore in the network
      maxConnections: 5  // Max number of connections to explore per node
    };
  }
}); 