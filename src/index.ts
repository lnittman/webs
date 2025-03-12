#!/usr/bin/env node

import { Command } from 'commander';
import { processQueue } from './lib/queue';
import { generateSummary, SummaryResponse } from './lib/summarizer';
import { generateContentSummary } from './lib/ai-summary';
import DatabaseManager, { Page, GetContentOptions } from './lib/database';
import chalk from 'chalk';
import ora from 'ora';
import clipboardy from 'clipboardy';
import { startChatSession } from './lib/chat';
import { estimateTokens } from './lib/token-counter';
import { fetchCommand } from './commands/fetch';
import { listCommand } from './commands/list';
import { copyCommand } from './commands/copy';
import { chatCommand } from './commands/chat';
import { deleteCommand } from './commands/delete';
import { cleanCommand } from './commands/clean';
import { statsCommand } from './commands/stats';
import { processQueue as sharedProcessQueue, fetchContent, storeContent } from 'webs-shared';

// Create a new command instance
const program = new Command()
  .name('webs')
  .description('Fetch, store, and interact with web content')
  .version('1.0.0');

// Setup program metadata
program
  .name('webs')
  .description('Fetch, store, and interact with web content')
  .version('1.0.0');

// Add commands
fetchCommand(program);
listCommand(program);
copyCommand(program);
chatCommand(program);
deleteCommand(program);
cleanCommand(program);
statsCommand(program);

// Add a global help flag
program
  .option('-h, --help', 'Display help information')
  .on('option:help', () => {
    program.outputHelp();
    process.exit(0);
  });

// Set the banner
console.log(chalk.yellow(`
🐶 webs - web content management
`));

// Parse the arguments
program.parse(process.argv);

// If no arguments provided, display help
if (process.argv.length < 3) {
  program.outputHelp();
}

// Main command for fetching content
program
  .command('fetch')
  .description('Fetch content from a URL and store it in the database')
  .argument('<url>', 'URL to fetch content from')
  .option('-d, --depth <number>', 'Maximum depth to follow links', '1')
  .option('-m, --max-pages <number>', 'Maximum number of pages to fetch', '100')
  .option('-q, --quiet', 'Disable progress output', false)
  .option('-s, --summary', 'Generate a summary of fetched content', false)
  .option('-n, --no-cache', 'Bypass cache when generating summary', false)
  .action(async (url: string, options: { 
    depth?: string; 
    maxPages?: string; 
    quiet?: boolean;
    summary?: boolean;
    cache?: boolean;
  }) => {
    try {
      // Print welcome message
      if (!options.quiet) {
        console.log(`\n${chalk.bold('⚡ webs')}\n`);
        console.log(`fetching ${chalk.blue(url)} and following links up to depth ${options.depth || '1'}\n`);
      }
      
      // Process the queue
      await processQueue(url, {
        maxDepth: parseInt(options.depth || '1', 10),
        maxPages: parseInt(options.maxPages || '100', 10),
        showProgress: !options.quiet
      });
      
      // Generate and display summary if requested
      if (options.summary) {
        if (!process.env.OPENROUTER_API_KEY) {
          console.error(`\n${chalk.red('error:')} OPENROUTER_API_KEY environment variable is required for summary generation`);
          process.exit(1);
        }
        
        console.log(`\n${chalk.bold('generating summary...')}\n`);
        
        const spinner = ora('Analyzing content with AI...').start();
        
        try {
          const summary = await generateSummary(url, {
            apiKey: process.env.OPENROUTER_API_KEY,
            maxContentLength: 50000, // Limit content size to avoid token limits
            useCache: options.cache
          });
          
          spinner.succeed('Summary generated');
          
          // Display the summary in a nice format
          console.log(`\n${chalk.bold.underline(summary.title)}\n`);
          console.log(summary.overview);
          
          console.log(`\n${chalk.bold('Key Topics:')}`);
          summary.keyTopics.forEach(topic => {
            console.log(`  • ${topic}`);
          });
          
          if (summary.relatedLinks && summary.relatedLinks.length > 0) {
            console.log(`\n${chalk.bold('Related Links:')}`);
            summary.relatedLinks.forEach(link => {
              console.log(`  • ${link}`);
            });
          }
        } catch (error) {
          spinner.fail(`Failed to generate summary: ${(error as Error).message}`);
        }
      }
      
    } catch (error) {
      console.error(`\n${chalk.red('error:')} ${(error as Error).message}`);
      process.exit(1);
    }
  });

// List command for showing indexed URLs
program
  .command('list')
  .description('List URLs that have been indexed in the database')
  .option('-a, --all', 'Show all URLs instead of grouping by domain', false)
  .option('-d, --domain <domain>', 'Show only URLs from a specific domain')
  .option('-t, --tree', 'Show URLs in a tree view', false)
  .option('-f, --format <format>', 'Output format (default|json|simple)', 'default')
  .option('-n, --no-dog-summary', 'Skip generating a dog-themed summary', false)
  .action(async (options: {
    all?: boolean;
    domain?: string;
    tree?: boolean;
    format?: 'default' | 'json' | 'simple';
    dogSummary?: boolean;
  }) => {
    try {
      console.log(`\n${chalk.bold('⚡ webs')}\n`);
      
      const db = DatabaseManager.getInstance();
      
      // Get pages from the database
      const pages = db.getAllPages({
        limit: 1000 // Get enough pages to work with
      });
      
      if (pages.length === 0) {
        console.log(chalk.yellow('No URLs found in the database.'));
        return;
      }
      
      let contentForSummary = '';
      
      // Output the results based on format
      switch (options.format) {
        case 'json':
          console.log(JSON.stringify(pages, null, 2));
          contentForSummary = JSON.stringify(pages, null, 2);
          break;
          
        case 'simple':
          pages.forEach((page: Page) => {
            console.log(page.url);
            contentForSummary += page.url + '\n';
          });
          break;
          
        default:
          if (options.all) {
            // Show all URLs in a simple list
            pages.forEach((page: Page, index: number) => {
              console.log(`${chalk.gray(`${index + 1}.`)} ${page.url}`);
              contentForSummary += `${index + 1}. ${page.url}\n`;
            });
          } else if (options.domain) {
            // Show URLs for a specific domain in tree view
            const domainPages = pages.filter((page: Page) => {
              return getDomainFromUrl(page.url) === options.domain;
            });
            
            if (domainPages.length === 0) {
              console.log(chalk.yellow(`No URLs found for domain '${options.domain}'.`));
              return;
            }
            
            console.log(chalk.bold(`URLs for domain: ${chalk.blue(options.domain)}\n`));
            contentForSummary = `URLs for domain: ${options.domain}\n\n`;
            
            if (options.tree) {
              // For the tree view, we'll gather content for the summary separately
              const pathsForSummary: string[] = [];
              
              // Show URLs in a tree view
              displayUrlTree(domainPages);
              
              // Gather paths for summary
              domainPages.forEach((page: Page) => {
                const path = getPathFromUrl(page.url);
                pathsForSummary.push(path || '/');
              });
              
              contentForSummary += pathsForSummary.map((path, index) => `${index + 1}. ${path}`).join('\n');
            } else {
              // Show URLs in a simple list
              domainPages.forEach((page: Page, index: number) => {
                const path = getPathFromUrl(page.url);
                console.log(`${chalk.gray(`${index + 1}.`)} ${path || '/'}`);
                contentForSummary += `${index + 1}. ${path || '/'}\n`;
              });
            }
            
            // Now, add page titles and a bit of content for better summaries
            contentForSummary += '\n\nPage Details:\n';
            domainPages.forEach((page: Page) => {
              contentForSummary += `\nTitle: ${page.title}\n`;
              contentForSummary += `URL: ${page.url}\n`;
              // Add just a snippet of the content (first 200 chars)
              contentForSummary += `Content Snippet: ${page.content.substring(0, 200)}...\n`;
            });
          } else {
            // Group by domain and show domain names
            const domains = groupByDomain(pages);
            const domainNames = Object.keys(domains).sort();
            
            console.log(chalk.bold('Domains:\n'));
            contentForSummary = 'Domains:\n\n';
            
            domainNames.forEach((domain, index) => {
              const count = domains[domain].length;
              console.log(`${chalk.gray(`${index + 1}.`)} ${chalk.blue(domain)} ${chalk.gray(`(${count} page${count !== 1 ? 's' : ''})`)}`)
              contentForSummary += `${index + 1}. ${domain} (${count} page${count !== 1 ? 's' : ''})\n`;
            });
            
            console.log('\nUse arrow keys to navigate and Enter to select a domain.');
            console.log(`Or run: ${chalk.cyan('webs list -d <domain>')} to view pages for a domain.`);
            console.log(`Add ${chalk.cyan('--tree')} for a directory-style view: ${chalk.cyan('webs list -d <domain> --tree')}`);
          }
          break;
      }
      
      // Generate a dog-themed summary if enabled and we have content and API key
      if (options.dogSummary !== false && contentForSummary) {
        if (process.env.OPENROUTER_API_KEY) {
          console.log('\n');
          try {
            // Show a spinner while waiting for the summary
            const summarySpinner = ora('Generating content summary...').start();
            const dogSummary = await generateContentSummary(contentForSummary, process.env.OPENROUTER_API_KEY);
            summarySpinner.stop();
            console.log(dogSummary);
          } catch (error) {
            console.error(`\n${chalk.yellow('Note:')} Could not generate summary: ${(error as Error).message}`);
          }
        } else {
          console.log(`\n${chalk.yellow('Note:')} Set the OPENROUTER_API_KEY environment variable to get dog-themed summaries!`);
        }
      }
      
    } catch (error) {
      console.error(`\n${chalk.red('error:')} ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Copy command for copying content to clipboard
program
  .command('copy')
  .description('Copy content from indexed URLs to clipboard')
  .argument('<target>', 'Domain or specific path to copy content from (format: domain[/path])')
  .option('-t, --include-title', 'Include titles in copied content', false)
  .option('-d, --include-date', 'Include dates in copied content', false)
  .option('-f, --format <format>', 'Output format (markdown|text|json)', 'markdown')
  .option('-n, --no-dog-summary', 'Skip generating a dog-themed summary')
  .action(async (target, options) => {
    try {
      // Extract domain and optional path
      let domain = target;
      let path;
      
      if (target.includes('/')) {
        const parts = target.split('/', 2);
        domain = parts[0];
        path = parts[1];
      }
      
      const db = DatabaseManager.getInstance();
      
      // Get content from database
      const content = db.getContentByDomainAndPath(domain, path, {
        includeTitle: options.includeTitle,
        includeFetchDate: options.includeDate,
        format: options.format as 'markdown' | 'text' | 'json'
      });
      
      if (!content) {
        console.log(chalk.red(`No content found for ${target}`));
        return;
      }
      
      // Calculate token estimate
      const tokenInfo = estimateTokens(content);
      
      // Copy to clipboard
      const spinner = ora('Copying content to clipboard...').start();
      await clipboardy.write(content);
      spinner.succeed(`Content copied to clipboard!`);
      
      // Display token estimate
      console.log(chalk.cyan(`📊 Token estimate: ${tokenInfo.visual}`));
      
      // Show specific model estimates if there's a significant content
      if (tokenInfo.count > 1000) {
        console.log(chalk.dim(`Model-specific estimates:`));
        for (const [model, estimate] of Object.entries(tokenInfo.byModel)) {
          if (model !== 'default') {
            console.log(chalk.dim(`  - ${model.padEnd(8)}: ~${estimate.toLocaleString()} tokens`));
          }
        }
      }
      
      // Generate a dog-themed summary if requested
      if (options.dogSummary !== false) {
        // Prepare content for summary - use titles and excerpts from each page
        const pages = path 
          ? db.getPagesByDomain(domain).filter(p => p.url.includes(path))
          : db.getPagesByDomain(domain);
        
        if (pages.length === 0) {
          console.log(chalk.yellow('No pages found to summarize.'));
          return;
        }
        
        const contentForSummary = pages.map(page => 
          `URL: ${page.url}\nTitle: ${page.title}\n${page.content.slice(0, 200)}...`
        ).join('\n\n');
        
        if (process.env.OPENROUTER_API_KEY) {
          console.log('\n');
          try {
            // Show a spinner while waiting for the summary
            const summarySpinner = ora('Generating content summary...').start();
            const dogSummary = await generateContentSummary(contentForSummary, process.env.OPENROUTER_API_KEY);
            summarySpinner.stop();
            console.log(dogSummary);
          } catch (error) {
            console.error(`\n${chalk.yellow('Note:')} Could not generate summary: ${(error as Error).message}`);
          }
        } else {
          console.log(`\n${chalk.yellow('Note:')} Set the OPENROUTER_API_KEY environment variable to get dog-themed summaries!`);
        }
      }
    } catch (error) {
      console.error(`Error: ${(error as Error).message}`);
    }
  });

// Add Database Management Commands
program
  .command('delete')
  .description('Delete content from the database by domain or URL')
  .argument('<target>', 'Domain name or specific URL to delete')
  .option('-a, --all', 'Delete all content from the specified domain', false)
  .option('-f, --force', 'Skip confirmation prompt', false)
  .action(async (target, options) => {
    const db = DatabaseManager.getInstance();
    
    // Determine if target is a domain or URL
    if (target.includes('http') || target.includes('://')) {
      // Handle single URL deletion
      const exists = db.pageExists(target);
      
      if (!exists) {
        console.log(chalk.red(`URL not found: ${target}`));
        return;
      }
      
      if (!options.force) {
        // Use a confirm prompt before deletion
        const confirmed = await confirm(`Are you sure you want to delete this URL? ${target}`);
        if (!confirmed) return;
      }
      
      // Delete the URL
      const result = db.deletePage(target);
      console.log(chalk.green(`Deleted URL: ${target}`));
      
    } else {
      // Handle domain deletion
      const domain = target.toLowerCase();
      const pages = db.getPagesByDomain(domain);
      
      if (pages.length === 0) {
        console.log(chalk.red(`No pages found for domain: ${domain}`));
        return;
      }
      
      console.log(`Found ${pages.length} pages for domain: ${domain}`);
      
      if (!options.all) {
        console.log(chalk.yellow('Use the --all flag to delete all pages for this domain'));
        
        // List the pages that would be deleted
        pages.slice(0, 5).forEach(page => {
          console.log(`- ${page.url}`);
        });
        
        if (pages.length > 5) {
          console.log(`... and ${pages.length - 5} more`);
        }
        
        return;
      }
      
      if (!options.force) {
        const confirmed = await confirm(`Are you sure you want to delete all ${pages.length} pages for domain: ${domain}?`);
        if (!confirmed) return;
      }
      
      // Delete all pages for the domain
      let deletedCount = 0;
      pages.forEach(page => {
        if (db.deletePage(page.url)) {
          deletedCount++;
        }
      });
      
      console.log(chalk.green(`Deleted ${deletedCount} pages for domain: ${domain}`));
    }
  });

program
  .command('clean')
  .description('Clean the database by removing broken links and orphaned records')
  .option('-f, --force', 'Skip confirmation prompt', false)
  .action(async (options) => {
    const db = DatabaseManager.getInstance();
    const stats = db.getStats();
    
    console.log('Current database statistics:');
    console.log(`- ${stats.pages} pages`);
    console.log(`- ${stats.links} links`);
    console.log(`- ${stats.unprocessedLinks} unprocessed links`);
    
    if (!options.force) {
      const confirmed = await confirm('Are you sure you want to clean the database?');
      if (!confirmed) return;
    }
    
    const spinner = ora('Cleaning database...').start();
    
    // Run the clean operation
    const results = db.cleanDatabase();
    
    spinner.stop();
    console.log(chalk.green('Database cleaned successfully!'));
    console.log(`- Removed ${results.removedLinks} broken links`);
    console.log(`- Removed ${results.removedUnprocessedLinks} unprocessed links`);
  });

program
  .command('stats')
  .description('Show database statistics')
  .option('-d, --detailed', 'Show detailed statistics', false)
  .action((options) => {
    const db = DatabaseManager.getInstance();
    const stats = db.getStats();
    
    console.log('⚡ Database Statistics:');
    console.log(`- ${stats.pages} pages`);
    console.log(`- ${stats.links} links`);
    console.log(`- ${stats.unprocessedLinks} unprocessed links`);
    
    if (options.detailed) {
      // Get domain statistics
      const allPages = db.getAllPages();
      const domainStats = groupByDomain(allPages);
      
      console.log('\nDomain Statistics:');
      Object.entries(domainStats)
        .sort((a, b) => b[1].length - a[1].length)
        .forEach(([domain, pages]) => {
          console.log(`- ${domain}: ${pages.length} pages`);
        });
    }
  });

program
  .command('chat')
  .description('Chat with your indexed content using AI')
  .argument('[domain]', 'Domain to focus on (optional)')
  .option('-p, --path <path>', 'Path within the domain to focus on')
  .option('-m, --model <model>', 'Model to use for chat (gemini-pro, gemini-flash, claude, gpt-4, mixtral, llama3, or full model ID)')
  .option('-c, --context-limit <limit>', 'Maximum characters to include in context', (val) => parseInt(val, 10))
  .action(async (domain, options) => {
    if (!process.env.OPENROUTER_API_KEY) {
      console.log(chalk.red('Error: OPENROUTER_API_KEY environment variable is not set.'));
      console.log('Please set it with:');
      console.log(chalk.yellow('export OPENROUTER_API_KEY="your-api-key"'));
      return;
    }
    
    try {
      await startChatSession({
        domain: domain,
        path: options.path,
        model: options.model,
        contextLimit: options.contextLimit
      });
    } catch (error) {
      console.error('Error in chat session:', error);
    }
  });

// Add a function to show confirmation prompts
async function confirm(message: string): Promise<boolean> {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise<boolean>((resolve) => {
    readline.question(`${message} (y/N) `, (answer: string) => {
      readline.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// Helper functions for URL processing and display

/**
 * Extract the domain name from a URL
 */
function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    let hostname = urlObj.hostname;
    
    // Remove www. prefix if present
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    // Extract the main domain (e.g., "example" from "example.com")
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
    
    return hostname;
  } catch (error) {
    return url;
  }
}

/**
 * Extract the path from a URL
 */
function getPathFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch (error) {
    return url;
  }
}

/**
 * Group pages by domain
 */
function groupByDomain(pages: Page[]): Record<string, Page[]> {
  const domains: Record<string, Page[]> = {};
  
  pages.forEach((page: Page) => {
    const domain = getDomainFromUrl(page.url);
    
    if (!domains[domain]) {
      domains[domain] = [];
    }
    
    domains[domain].push(page);
  });
  
  return domains;
}

/**
 * Display URLs in a tree view
 */
function displayUrlTree(pages: Page[]): void {
  // Group pages by path segments
  const tree: any = {};
  
  pages.forEach((page: Page) => {
    try {
      const urlObj = new URL(page.url);
      const path = urlObj.pathname;
      const segments = path.split('/').filter(Boolean);
      
      let currentLevel = tree;
      
      // Create nested tree structure
      segments.forEach((segment, i) => {
        if (!currentLevel[segment]) {
          currentLevel[segment] = {};
        }
        
        currentLevel = currentLevel[segment];
        
        // If this is the last segment, store the page
        if (i === segments.length - 1) {
          currentLevel['__page'] = page;
        }
      });
      
      // Handle root path
      if (segments.length === 0) {
        tree['__root'] = page;
      }
    } catch (error) {
      // Skip invalid URLs
    }
  });
  
  // Render the tree
  renderTree(tree, 0);
}

/**
 * Render a tree structure recursively
 */
function renderTree(node: any, level: number, prefix: string = ''): void {
  const indent = '  '.repeat(level);
  const keys = Object.keys(node).filter(k => k !== '__page' && k !== '__root');
  
  // Show root page if exists
  if (node['__root']) {
    console.log(`${indent}${chalk.cyan('/')} ${chalk.gray(`[${node['__root'].title}]`)}`);
  }
  
  // Render each key with its children
  keys.forEach((key, i) => {
    const isLast = i === keys.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';
    
    console.log(`${indent}${prefix}${connector}${chalk.cyan(key)}`);
    
    // If this node has a page, show the title
    if (node[key]['__page']) {
      console.log(`${indent}${prefix}${childPrefix}${chalk.gray(`[${node[key]['__page'].title}]`)}`);
    }
    
    // Recursively render children
    renderTree(node[key], level, prefix + childPrefix);
  });
}

// For backward compatibility, set 'fetch' as the default command
program.action((source, options) => {
  program.command('fetch').parseAsync([source, ...process.argv.slice(3)]);
});

// Parse command line arguments
program.parse();

// If no arguments provided, show help
if (process.argv.length < 3) {
  program.help();
} 