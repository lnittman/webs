import { Step } from "@mastra/core/workflows";
import { z } from "zod";
import { loadPromptTemplate } from "../../../utils/loadPrompt";
import { extractUrls, isUrl } from "../../steps/extractUrls";

// Load the instructions for the main mode
const mainInstructions = loadPromptTemplate("agents/main/instructions.xml", "");

export const analyzeInputStep = new Step({
  id: "analyzeInput",
  inputSchema: z.object({
    prompt: z.string(),
  }),
  execute: async ({ context }) => {
    console.log(`[WORKFLOW:analyzeInput] Analyzing input: ${context.inputData.prompt.substring(0, 50)}...`);
    
    const prompt = context.inputData.prompt.trim();
    
    // Always extract URLs from the prompt
    const extractedUrls = extractUrls(prompt);
    
    console.log(`[WORKFLOW:analyzeInput] Extracted ${extractedUrls.length} URLs from prompt`);
    
    return {
      originalPrompt: prompt,
      extractedUrls,
      instructions: mainInstructions,
      // Set the primary URL if exactly one URL was found
      primaryUrl: extractedUrls.length === 1 ? extractedUrls[0] : undefined
    };
  }
}); 