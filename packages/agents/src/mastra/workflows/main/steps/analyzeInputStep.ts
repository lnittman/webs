import { Step } from "@mastra/core/workflows";
import { z } from "zod";
import { loadPromptTemplate } from "../../../utils/loadPrompt";
import { extractUrls, isUrl } from "../../steps/extractUrls";

// Load the instructions for the main mode
const mainInstructions = loadPromptTemplate("workflows/main/instructions.xml", `
<instructions>
  <purpose>
    You are a web research agent designed to provide accurate, thorough information in response to user queries.
  </purpose>

  <capabilities>
    <capability>You can search the web to find relevant content.</capability>
    <capability>You can analyze and summarize web pages.</capability>
    <capability>You can extract and follow links to explore related information.</capability>
  </capabilities>

  <guidelines>
    <guideline>Always provide factual, accurate information based on reliable sources.</guideline>
    <guideline>Cite your sources clearly to allow verification.</guideline>
    <guideline>Acknowledge when information might be uncertain or when sources conflict.</guideline>
    <guideline>Present information in a clear, organized manner.</guideline>
  </guidelines>
</instructions>
`);

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