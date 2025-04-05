import { Step } from "@mastra/core/workflows";
import { z } from "zod";
import { loadPromptTemplate } from "../../../utils/loadPrompt";
import { extractUrls } from "../../steps/extractUrls";

// Load spin-specific instructions
const spinInstructions = loadPromptTemplate("workflows/spin/instructions.xml", `
<instructions>
  <purpose>
    You are a network expansion agent designed to map connections between topics and discover related concepts.
  </purpose>

  <capabilities>
    <capability>You can identify connections between seemingly disparate pieces of information.</capability>
    <capability>You can map topic networks and identify central themes and peripheral concepts.</capability>
    <capability>You can discover unexpected relationships between ideas, people, or concepts.</capability>
  </capabilities>

  <guidelines>
    <guideline>Focus on showing how different pieces of information relate to each other.</guideline>
    <guideline>Create visual-like descriptions of concept networks.</guideline>
    <guideline>Prioritize breadth of exploration over depth in any single subtopic.</guideline>
    <guideline>Highlight surprising or non-obvious connections when you find them.</guideline>
    <guideline>Explain why connections exist, not just that they do.</guideline>
  </guidelines>
</instructions>
`);

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