import fetch from 'node-fetch';
import chalk from 'chalk';
import DatabaseManager from './database';
import { Page } from './database';
import readline from 'readline';

/**
 * Configuration options for the chat session
 */
export interface ChatOptions {
  domain?: string;        // Specific domain to focus on
  path?: string;          // Specific path within a domain
  model?: string;         // OpenRouter model to use
  contextLimit?: number;  // Maximum number of characters to include in context
  history?: ChatMessage[]; // Previous chat history
}

/**
 * Structure of a chat message
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Default models available through OpenRouter
 */
const DEFAULT_MODELS: Record<string, string> = {
  'gemini-pro': 'google/gemini-pro',
  'gemini-flash': 'google/gemini-2-flash-001',
  'claude': 'anthropic/claude-3-5-sonnet',
  'gpt-4': 'openai/gpt-4-turbo',
  'mixtral': 'mistralai/mixtral-8x7b-instruct',
  'llama3': 'meta-llama/llama-3-70b-instruct'
};

/**
 * Start an interactive chat session about web content
 */
export async function startChatSession(options: ChatOptions): Promise<void> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.log(chalk.red('Error: OPENROUTER_API_KEY environment variable is not set.'));
    console.log('Please set it with:');
    console.log(chalk.yellow('export OPENROUTER_API_KEY="your-api-key"'));
    return;
  }
  
  // Validate model choice or use default
  const modelId = options.model ? 
    (DEFAULT_MODELS[options.model] || options.model) : 
    DEFAULT_MODELS['gemini-pro'];
  
  console.log(`\n${chalk.yellow('⚡ Webs Chat')}`);
  console.log(`Using model: ${chalk.cyan(modelId)}`);
  
  // Prepare context about the content based on domain/path
  const context = await prepareContentContext(options);
  
  if (!context) {
    console.log(chalk.red('No content found to chat about.'));
    return;
  }
  
  console.log(chalk.green(`Loaded context from ${context.pageCount} pages in ${options.domain || 'all domains'}`));
  
  if (options.path) {
    console.log(chalk.green(`Focusing on path: ${options.path}`));
  }
  
  // Setup chat history
  const history: ChatMessage[] = options.history || [];
  
  // Add system message with context
  history.push({
    role: 'system',
    content: `You are a professional content assistant who specializes in discussing web content. 
    Your job is to help the user explore and understand content they have indexed in their database.
    You should answer questions about the content, explain concepts, provide summaries, and help the user navigate the information.
    
    The user has indexed the following content in their database:
    ${context.summary}
    
    Always use a professional, helpful tone. Cite specific URLs when referring to specific content.
    If asked about content that doesn't appear to be in the context, politely explain that information is not available in the indexed content.`
  });
  
  // Start the interactive chat session
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('\nChat with your indexed content! Type "exit" or "quit" to end the session.');
  console.log('Type "context" to see what content is available to the model.');
  console.log('Type "models" to see available model shortcuts.\n');
  
  const chatLoop = async () => {
    const userInput = await new Promise<string>(resolve => {
      rl.question(chalk.green('You: '), resolve);
    });
    
    // Handle special commands
    if (userInput.toLowerCase() === 'exit' || userInput.toLowerCase() === 'quit') {
      rl.close();
      console.log(chalk.yellow('\nChat session ended.'));
      return;
    }
    
    if (userInput.toLowerCase() === 'context') {
      console.log(chalk.yellow('\nAvailable content context:'));
      console.log(context.summary);
      console.log(chalk.yellow(`\nTotal pages: ${context.pageCount}`));
      await chatLoop();
      return;
    }
    
    if (userInput.toLowerCase() === 'models') {
      console.log(chalk.yellow('\nAvailable model shortcuts:'));
      Object.entries(DEFAULT_MODELS).forEach(([shortcut, fullId]) => {
        console.log(`${chalk.cyan(shortcut)}: ${fullId}`);
      });
      console.log(chalk.yellow('\nYou can also use any full OpenRouter model ID.'));
      await chatLoop();
      return;
    }
    
    // Add user message to history
    history.push({ role: 'user', content: userInput });
    
    console.log(chalk.yellow('Assistant is thinking...'));
    
    try {
      // Call the model
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://github.com/your-username/webs-cli',
          'X-Title': 'Webs CLI Tool'
        },
        body: JSON.stringify({
          model: modelId,
          messages: history,
          max_tokens: 1500
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.error('Error from OpenRouter API:', data.error);
        console.log(chalk.red(`Error: ${data.error.message || 'Unknown error'}`));
        await chatLoop();
        return;
      }
      
      const reply = data.choices[0].message.content;
      
      // Add assistant response to history
      history.push({ role: 'assistant', content: reply });
      
      // Format and display the response
      console.log(chalk.yellow('\nAssistant:\n'));
      console.log(reply.trim());
      console.log('\n');
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      console.log(chalk.red(`Error: ${(error as Error).message}`));
    }
    
    await chatLoop();
  };
  
  await chatLoop();
}

/**
 * Prepare content context based on domain and path
 */
async function prepareContentContext(options: ChatOptions): Promise<{ summary: string, pageCount: number } | null> {
  const db = DatabaseManager.getInstance();
  let pages: Page[] = [];
  
  // Get pages based on domain and optional path
  if (options.domain) {
    if (options.path) {
      // Get pages matching domain and path
      const pathPattern = options.path.startsWith('/') ? options.path : `/${options.path}`;
      pages = db.getPagesByDomain(options.domain).filter(page => 
        page.url.includes(pathPattern) || page.url.includes(encodeURI(pathPattern))
      );
    } else {
      // Get all pages for domain
      pages = db.getPagesByDomain(options.domain);
    }
  } else {
    // Get all pages, but limit to avoid context overflow
    pages = db.getAllPages().slice(0, 50);
  }
  
  if (pages.length === 0) {
    return null;
  }
  
  // Create a summary of available content
  const contextLimit = options.contextLimit || 15000;
  let contentSummary = '';
  
  // Group by domain if no specific domain
  if (!options.domain) {
    const domains = groupByDomain(pages);
    contentSummary = Object.entries(domains)
      .map(([domain, domainPages]) => {
        return `Domain: ${domain} (${domainPages.length} pages)\n` + 
        domainPages.slice(0, 10).map(p => `- ${p.url} | ${p.title}`).join('\n') +
        (domainPages.length > 10 ? `\n  ... and ${domainPages.length - 10} more pages` : '');
      }).join('\n\n');
  } else {
    // Detailed info for a specific domain
    contentSummary = pages.map(page => {
      return `URL: ${page.url}\nTitle: ${page.title}\nExcerpt: ${truncateContent(page.content, 200)}`;
    }).join('\n\n');
    
    // Add some full content for context, but within limits
    let remainingChars = contextLimit - contentSummary.length;
    if (remainingChars > 3000) {
      contentSummary += '\n\nHere is the full content of some pages:\n\n';
      
      for (const page of pages) {
        if (remainingChars < 1000) break;
        
        const contentToAdd = `===== ${page.url} =====\n${page.title}\n\n${truncateContent(page.content, remainingChars - 100)}\n\n`;
        contentSummary += contentToAdd;
        remainingChars -= contentToAdd.length;
      }
    }
  }
  
  // Truncate if necessary
  if (contentSummary.length > contextLimit) {
    contentSummary = truncateContent(contentSummary, contextLimit);
  }
  
  return {
    summary: contentSummary,
    pageCount: pages.length
  };
}

/**
 * Helper to truncate content to a maximum length
 */
function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) {
    return content;
  }
  return content.substring(0, maxLength) + '... (truncated)';
}

/**
 * Group pages by domain
 */
function groupByDomain(pages: Page[]): Record<string, Page[]> {
  const result: Record<string, Page[]> = {};
  
  for (const page of pages) {
    const domain = extractDomain(page.url);
    if (!result[domain]) {
      result[domain] = [];
    }
    result[domain].push(page);
  }
  
  return result;
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    let domain = urlObj.hostname;
    
    // Remove www prefix if present
    domain = domain.replace(/^www\./, '');
    
    // Extract the main part of the domain
    const parts = domain.split('.');
    if (parts.length > 2) {
      return parts.slice(parts.length - 2).join('.');
    }
    
    return domain;
  } catch (e) {
    // Fallback for invalid URLs
    return url.split('/')[0];
  }
} 