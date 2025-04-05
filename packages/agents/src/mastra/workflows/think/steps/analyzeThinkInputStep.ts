import { Step } from "@mastra/core/workflows";
import { z } from "zod";
import { loadPromptTemplate } from "../../../utils/loadPrompt";
import { extractUrls } from "../../steps/extractUrls";

// Load think-specific instructions
const thinkInstructions = loadPromptTemplate("workflows/think/instructions.xml", `
<instructions>
  <purpose>
    You are a deep analysis agent designed to thoroughly explore complex questions with careful reasoning and analysis.
  </purpose>

  <capabilities>
    <capability>You can conduct in-depth research on complex topics.</capability>
    <capability>You can break down problems into component parts and analyze each systematically.</capability>
    <capability>You can pause for human feedback to guide your research direction.</capability>
    <capability>You can draw connections between seemingly disparate concepts.</capability>
  </capabilities>

  <guidelines>
    <guideline>Make your reasoning process explicit and transparent.</guideline>
    <guideline>Consider multiple perspectives and potential interpretations.</guideline>
    <guideline>Acknowledge limitations and uncertainties in your analysis.</guideline>
    <guideline>Incorporate human feedback thoughtfully into your research process.</guideline>
    <guideline>Present complex information in a structured, digestible format.</guideline>
  </guidelines>
</instructions>
`);

export const analyzeThinkInputStep = new Step({
  id: "analyzeThinkInput",
  inputSchema: z.object({
    prompt: z.string(),
    threadId: z.string(),
    feedbackEnabled: z.boolean().optional().default(true),
  }),
  execute: async ({ context }) => {
    console.log(`[WORKFLOW:think:analyzeInput] Analyzing input with reasoning: ${context.inputData.prompt.substring(0, 50)}...`);
    
    const prompt = context.inputData.prompt.trim();
    const threadId = context.inputData.threadId;
    const feedbackEnabled = context.inputData.feedbackEnabled !== false;
    
    // Extract URLs from the prompt
    const extractedUrls = extractUrls(prompt);
    
    console.log(`[WORKFLOW:think:analyzeInput] Extracted ${extractedUrls.length} URLs from prompt (feedback ${feedbackEnabled ? 'enabled' : 'disabled'})`);
    
    // Build an initial reasoning analysis of the prompt
    const initialReasoning = `
# Initial Analysis

## Query Understanding
I need to thoroughly analyze and research: "${prompt}"

## Identified Resources
${extractedUrls.length > 0 ? `
I've identified these URLs that may contain relevant information:
${extractedUrls.map((url, i) => `${i+1}. ${url}`).join('\n')}
` : 'No specific URLs were provided in the query. I will need to search for relevant information.'}

## Research Approach
I'll take a structured, analytical approach to answering this query:
1. Gather initial information from ${extractedUrls.length > 0 ? 'the provided URLs and ' : ''}web search
2. Analyze the collected data to identify patterns, connections, and gaps
3. Formulate a comprehensive response that addresses all aspects of the query
4. Present my findings with clear reasoning and evidence

I'll make my thinking process explicit throughout this exploration.
`;
    
    return {
      originalPrompt: prompt,
      extractedUrls,
      instructions: thinkInstructions,
      primaryUrl: extractedUrls.length === 1 ? extractedUrls[0] : undefined,
      // Think mode specific fields
      threadId,
      feedbackEnabled,
      reasoning: initialReasoning
    };
  }
}); 