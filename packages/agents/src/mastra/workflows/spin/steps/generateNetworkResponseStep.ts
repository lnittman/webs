import { Step } from "@mastra/core/workflows";
import { z } from "zod";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

const geminiModel = google("gemini-2.0-flash") as any;

export const generateNetworkResponseStep = new Step({
  id: "generateNetworkResponse",
  inputSchema: z.object({
    originalPrompt: z.string(),
    nodes: z.array(z.object({
      url: z.string(),
      title: z.string().optional(),
      summary: z.string().optional(),
      connections: z.array(z.string()).optional()
    })).optional(),
    centralTopic: z.string().optional(),
    relatedTopics: z.array(z.string()).optional(),
    instructions: z.string().optional()
  }),
  execute: async ({ context }) => {
    console.log(`[WORKFLOW:spin:generateNetworkResponse] Generating network response`);
    
    const prompt = context.inputData.originalPrompt;
    const nodes = context.inputData.nodes || [];
    const centralTopic = context.inputData.centralTopic || prompt;
    const relatedTopics = context.inputData.relatedTopics || [];
    const instructions = context.inputData.instructions || "";
    
    // Format the network information for the prompt
    const networkInfo = nodes.map(node => `
URL: ${node.url}
Title: ${node.title || 'Unknown'}
Summary: ${node.summary || 'No summary available'}
Connected to: ${(node.connections || []).length} other pages
    `).join('\n---\n');
    
    // Format the topics for the prompt
    const topicsInfo = relatedTopics.length > 0 ? 
      `Related topics: ${relatedTopics.join(', ')}` :
      'No specific related topics identified';
    
    try {
      // Build the prompt for the response generation
      const aiPrompt = `
<instructions>
${instructions}
</instructions>

<user_query>
${prompt}
</user_query>

<network_information>
Central topic: ${centralTopic}
${topicsInfo}

Network of ${nodes.length} connected pages:
${networkInfo}
</network_information>

Please provide a network-oriented response that shows connections between related pieces of information. Use the network information to create a comprehensive analysis of how different sources connect to each other.

Follow these guidelines:
1. Emphasize relationships between different pieces of information
2. Highlight how key topics connect across different sources
3. Create a cohesive narrative that shows the interconnected nature of the information
4. Organize information in a way that shows the network structure of the topic
5. Be comprehensive but clear in presenting the connections
`;

      // Generate the network response with higher creativity
      const { text } = await generateText({
        model: geminiModel,
        prompt: aiPrompt,
        temperature: 0.7,  // Higher temperature for more creative connections
      });
      
      console.log(`[WORKFLOW:spin:generateNetworkResponse] Generated response (${text.length} chars)`);
      
      return {
        response: text,
        sources: nodes.map(node => node.url),
        prompt,
        networkSize: nodes.length,
        topicsIdentified: relatedTopics.length
      };
    } catch (error) {
      console.error(`[WORKFLOW:spin:generateNetworkResponse] Error: ${error instanceof Error ? error.message : String(error)}`);
      
      // Provide a fallback response if the LLM call fails
      return {
        response: `I've explored a network of ${nodes.length} connected pages about "${prompt}", but I'm unable to generate a proper network analysis at the moment.`,
        sources: nodes.map(node => node.url),
        prompt,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}); 