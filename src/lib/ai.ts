import { OpenRouter } from 'openrouter-sdk';
import { StreamingTextResponse } from 'ai';

// AI model configuration
export const AI_MODELS = {
  // High-quality models (use sparingly)
  CLAUDE_3_7_SONNET: 'anthropic/claude-3-7-sonnet',
  CLAUDE_3_7_THINKING: 'anthropic/claude-3-7-sonnet:thinking',
  GPT_4O: 'openai/gpt-4o',
  
  // Utility models (everyday use)
  GEMINI_2_FLASH: 'google/gemini-2-flash-001',
  CLAUDE_3_HAIKU: 'anthropic/claude-3-haiku',
  MISTRAL_LARGE: 'mistral/mistral-large',
  
  // Specialized models
  SONAR_REASONING: 'perplexity/sonar-reasoning',
  GEMINI_PRO_VISION: 'google/gemini-pro-vision',
  CLAUDE_3_5_SONNET: 'anthropic/claude-3-5-sonnet',
} as const;

export type ModelId = keyof typeof AI_MODELS;

// Initialize OpenRouter client
export const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: 'https://openrouter.ai/api/v1',
});

// Stream chat completions
export async function streamChatCompletion(
  messages: any[],
  model = AI_MODELS.GEMINI_2_FLASH,
  temperature = 0.7
) {
  try {
    const response = await openrouter.chat.completions.create({
      model,
      messages,
      stream: true,
      temperature: model.includes('thinking') ? 0.1 : temperature,
    });
    
    return new StreamingTextResponse(response);
  } catch (error) {
    console.error('Error streaming chat completion:', error);
    throw error;
  }
}

// Generate embeddings for semantic search
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openrouter.embeddings.create({
      model: 'openai/text-embedding-3-small',
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Return a placeholder embedding in case of error
    return Array(1536).fill(0).map(() => Math.random());
  }
}

// Smart model selection based on task requirements
export function selectModelForTask(task: {
  type: 'chat' | 'search' | 'reasoning' | 'vision' | 'generation',
  importance: 'critical' | 'standard' | 'background',
  complexity: 'high' | 'medium' | 'low'
}) {
  if (task.type === 'search') return AI_MODELS.SONAR_REASONING;
  if (task.type === 'vision') return AI_MODELS.GEMINI_PRO_VISION;
  
  if (task.importance === 'critical' || task.complexity === 'high') {
    return task.type === 'reasoning' ? AI_MODELS.CLAUDE_3_7_THINKING : AI_MODELS.CLAUDE_3_7_SONNET;
  }
  
  return AI_MODELS.GEMINI_2_FLASH; // Default utility model
}

// Generate a summary of content
export async function generateSummary(content: string) {
  const messages = [
    {
      role: 'system',
      content: `You are a professional content assistant specializing in summarizing web content.
      Your goal is to help users understand indexed content in a clear, concise manner.
      Please summarize the following content in 4-5 paragraphs, highlighting the most important information.
      Focus on the main topics, important concepts, and organization of the content.
      Use a professional, informative tone throughout.`
    },
    {
      role: 'user',
      content: content.length > 10000 
        ? content.substring(0, 10000) + "...(content trimmed for length)"
        : content
    }
  ];
  
  try {
    const response = await openrouter.chat.completions.create({
      model: AI_MODELS.GEMINI_2_FLASH,
      messages,
      temperature: 0.3,
      max_tokens: 1000,
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Unable to generate summary at this time.';
  }
} 