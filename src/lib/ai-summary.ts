import fetch from 'node-fetch';
import chalk from 'chalk';
import ora from 'ora';

/**
 * Generates a content summary using Google's Gemini-2-Flash-001 model
 * 
 * @param content - The content to summarize
 * @param apiKey - The OpenRouter API key
 * @returns A promise that resolves to the summary
 */
export async function generateContentSummary(content: string, apiKey: string): Promise<string> {
  if (!content || content.trim().length === 0) {
    return "No content to summarize.";
  }

  try {
    // Limit content length to avoid token limits
    const maxLength = 10000;
    const trimmedContent = content.length > maxLength 
      ? content.substring(0, maxLength) + "...(content trimmed for length)"
      : content;
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/your-username/webs-cli',
        'X-Title': 'Webs CLI Tool'
      },
      body: JSON.stringify({
        model: 'google/gemini-2-flash-001',
        messages: [
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
            content: trimmedContent
          }
        ],
        max_tokens: 1000
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Error from OpenRouter API:', data.error);
      return `Error generating summary: ${data.error.message || 'Unknown error'}`;
    }
    
    const summary = data.choices[0].message.content;
    return formatSummary(summary);
  } catch (error) {
    console.error('Error generating content summary:', error);
    return `Error generating summary: ${(error as Error).message}`;
  }
}

/**
 * Format the summary with improved readability
 */
function formatSummary(summary: string): string {
  const formatted = summary.trim();
  return `
📄 Content Summary

${chalk.cyan(formatted)}
`;
} 