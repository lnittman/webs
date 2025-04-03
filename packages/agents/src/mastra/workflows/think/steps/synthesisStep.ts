import { Step } from "@mastra/core/workflows";
import { z } from "zod";
import { generateText } from "ai";

// We'll use a simpler approach without the specific model
const MODEL_NAME = "gemini-2.0-flash";

export const synthesisStep = new Step({
  id: "synthesis",
  inputSchema: z.object({
    originalPrompt: z.string(),
    extractedUrls: z.array(z.string()).optional(),
    reasoning: z.string(),
    feedbackReceived: z.boolean().optional().default(false),
    webSearchResult: z.any().optional(),
    summarizedResults: z.array(z.any()).optional(),
    threadId: z.string().optional(),
  }),
  execute: async ({ context }) => {
    console.log(`[WORKFLOW:think:synthesis] Synthesizing results for: ${context.inputData.originalPrompt.substring(0, 50)}...`);
    
    const prompt = context.inputData.originalPrompt;
    const reasoning = context.inputData.reasoning;
    const feedbackReceived = context.inputData.feedbackReceived;
    const webSearchResult = context.inputData.webSearchResult;
    const summarizedResults = context.inputData.summarizedResults || [];
    
    // Compile all the research information
    let researchContent = '';
    let sourceUrls: string[] = [];
    
    // First, add any web search results we have
    if (webSearchResult && webSearchResult.snippets && webSearchResult.snippets.length > 0) {
      researchContent += "\n\n## Search Results\n";
      webSearchResult.snippets.forEach((snippet: string, index: number) => {
        researchContent += `\n${snippet}\n`;
      });
      
      // Add search result URLs to sources
      if (webSearchResult.urls && webSearchResult.urls.length > 0) {
        sourceUrls = [...sourceUrls, ...webSearchResult.urls];
      }
    }
    
    // Add any page summaries we have
    if (summarizedResults && summarizedResults.length > 0) {
      researchContent += "\n\n## Analyzed Content\n";
      summarizedResults.forEach((result: any) => {
        if (result.summary) {
          researchContent += `\n### ${result.title || result.url}\n${result.summary}\n`;
          
          // Add the URL to sources if it's not already there
          if (result.url && !sourceUrls.includes(result.url)) {
            sourceUrls.push(result.url);
          }
        }
      });
    }
    
    // Construct the prompt for the synthesis
    const synthesisPrompt = `
# Research Synthesis Task

## Original Query
${prompt}

## Research Approach
${reasoning}

${feedbackReceived ? "## Human Feedback\nThe research approach was refined based on human feedback." : ""}

${researchContent ? `## Research Information\n${researchContent}` : "## Research Information\nNo specific research content was found."}

## Source URLs
${sourceUrls.length > 0 ? sourceUrls.map(url => `- ${url}`).join('\n') : "No source URLs available."}

## Instructions
You are a research assistant tasked with synthesizing information into a comprehensive response.

1. Create a thorough and well-organized response that addresses the original query
2. Integrate information from all provided research sources
3. Ensure your response is factual and directly based on the research material
4. Structure your response with clear sections and, when appropriate, bullet points
5. Cite source URLs when referencing specific information
6. If the research information is insufficient, acknowledge limitations
7. Focus on providing clear and actionable insights that directly address the query
`;

    try {
      // Generate the synthesis using the AI model
      const result = await generateText({
        model: MODEL_NAME,
        prompt: synthesisPrompt,
        temperature: 0.3, // Lower temperature for factual responses
        maxTokens: 2048, // Allow for a comprehensive response
      });
      
      console.log(`[WORKFLOW:think:synthesis] Successfully synthesized research results`);
      
      return {
        synthesisResult: result.text,
        sourceUrls,
        originalPrompt: prompt
      };
    } catch (error) {
      console.error(`[WORKFLOW:think:synthesis] Error generating synthesis: ${error instanceof Error ? error.message : String(error)}`);
      
      // Provide a fallback response if the LLM call fails
      return {
        synthesisResult: `I've researched your query about "${prompt}". ${researchContent ? "Here's what I found:" : "Unfortunately, I couldn't find specific information to address your query."} ${researchContent}`,
        sourceUrls,
        originalPrompt: prompt,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}); 