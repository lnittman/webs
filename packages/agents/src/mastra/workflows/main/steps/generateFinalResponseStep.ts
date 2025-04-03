import { Step } from "@mastra/core/workflows";
import { z } from "zod";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

const geminiModel = google("gemini-2.0-flash") as any;

export const generateFinalResponseStep = new Step({
  id: "generateFinalResponse",
  inputSchema: z.object({
    mode: z.enum(["main", "spin", "think"]).optional().default("main"),
    includeReasoning: z.boolean().optional().default(false),
    includeSynthesis: z.boolean().optional().default(false),
  }),
  execute: async ({ context }) => {
    console.log(`[WORKFLOW:generateFinalResponse] Generating final response`);
    
    // Get results from previous steps
    const analysisResult = context.getStepResult('analyzeInput') || context.getStepResult('analyzeSpinInput');
    const reasoningResult = context.getStepResult('reasoning');
    const synthesisResult = context.getStepResult('synthesis');
    const crawlResult = context.getStepResult('initialCrawl');
    const searchResult = context.getStepResult('webSearch');
    const summaryResult = context.getStepResult('summarizePage');
    const comprehensiveResult = context.getStepResult('createComprehensiveSummary');
    
    // Determine the mode (main, spin, think)
    const mode = context.inputData.mode || "main";
    
    // Should we include reasoning and synthesis?
    const includeReasoning = context.inputData.includeReasoning || mode === "think";
    const includeSynthesis = context.inputData.includeSynthesis || mode === "think";
    
    let finalContent = "";
    let sourceUrls: string[] = [];
    
    // Determine the primary content to use in the response
    if (comprehensiveResult?.comprehensiveSummary) {
      finalContent = comprehensiveResult.comprehensiveSummary;
      sourceUrls = comprehensiveResult.sources || [];
    } else if (summaryResult?.summary) {
      finalContent = summaryResult.summary;
      sourceUrls = [crawlResult?.url].filter(Boolean);
    } else if (searchResult?.snippets && searchResult.snippets.length > 0) {
      // Join snippets if we only have search results
      finalContent = searchResult.snippets.join("\n\n");
      sourceUrls = searchResult.urls || [];
    } else {
      // Fallback if we don't have any content
      finalContent = "I wasn't able to find specific information about that.";
    }
    
    // Original user prompt
    const userPrompt = analysisResult?.originalPrompt || context.inputData.prompt;
    
    // Instructions from the XML file
    const instructions = analysisResult?.instructions || "";
    
    try {
      // Build the prompt for the final response generation
      const prompt = `
<instructions>
${instructions}
</instructions>

<user_query>
${userPrompt}
</user_query>

${includeReasoning && reasoningResult?.reasoning ? `
<reasoning>
${reasoningResult.reasoning}
</reasoning>
` : ''}

${includeSynthesis && synthesisResult?.synthesis ? `
<synthesis>
${synthesisResult.synthesis}
</synthesis>
` : ''}

<research_results>
${finalContent}
</research_results>

<sources>
${sourceUrls.map((url, i) => `${i+1}. ${url}`).join('\n')}
</sources>

<mode>${mode}</mode>

Please provide a ${mode === "spin" ? "network-oriented, " : ""}${mode === "think" ? "thorough, analytical, " : ""}comprehensive response to the user query based on the research results.
${mode === "spin" ? "Focus on showing connections between related pieces of information. Highlight how different sources connect to each other." : ""}
${mode === "think" ? "Show your reasoning process and analysis alongside the facts." : ""}

Follow these guidelines:
1. Be informative, accurate, and thorough
2. Organize information logically with clear sections
3. Cite sources where appropriate
4. Use a professional, helpful tone
5. Include only factual information found in the research results
6. If the information is insufficient, acknowledge limitations
${includeReasoning ? "7. Make your reasoning explicit to the user" : ""}
${includeSynthesis ? "8. Show how you synthesized information from different sources" : ""}
`;

      // Adjust temperature based on mode
      const temperature = mode === "spin" ? 0.7 : 0.3;

      // Generate the final response
      const { text } = await generateText({
        model: geminiModel,
        prompt,
        temperature, // Adjustable based on mode
      });
      
      console.log(`[WORKFLOW:generateFinalResponse] Generated response (${text.length} chars) for mode: ${mode}`);
      
      // Build the response object
      const responseObj: any = {
        response: text,
        sources: sourceUrls,
        prompt: userPrompt,
        mode
      };
      
      // Add additional context for think mode
      if (mode === "think" || includeReasoning) {
        responseObj.reasoning = reasoningResult?.reasoning;
      }
      
      if (mode === "think" || includeSynthesis) {
        responseObj.synthesis = synthesisResult?.synthesis;
      }
      
      // Return the final response
      return responseObj;
    } catch (error) {
      console.error(`[WORKFLOW:generateFinalResponse] Error: ${error instanceof Error ? error.message : String(error)}`);
      // Provide a fallback response if the LLM call fails
      return {
        response: `I've found some information about "${userPrompt}", but I'm unable to generate a proper response at the moment.\n\n${finalContent}`,
        sources: sourceUrls,
        prompt: userPrompt,
        mode,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}); 