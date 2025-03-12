import { fetchContent, FetchedContent } from './fetcher';
import { extractLinks, resolveUrl } from './parser';
import DatabaseManager, { Link, Page } from './database';
import ora from 'ora';
import chalk from 'chalk';

// Interface for queue processing options
export interface QueueOptions {
  maxDepth?: number;
  maxPages?: number;
  showProgress?: boolean;
}

// Default options for queue processing
const DEFAULT_OPTIONS: QueueOptions = {
  maxDepth: 1,
  maxPages: 100,
  showProgress: true
};

/**
 * Processes a URL and its linked pages
 * 
 * @param startUrl - The URL to start processing from
 * @param options - Options for queue processing
 * @returns A promise that resolves when processing is complete
 */
export async function processQueue(startUrl: string, options: QueueOptions = {}): Promise<void> {
  // Merge default options with provided options
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Get the database manager
  const db = DatabaseManager.getInstance();
  
  // Initialize counters
  let pagesProcessed = 0;
  let pagesSkipped = 0;
  let pagesWithErrors = 0;
  
  // Create a spinner for showing progress
  const spinner = opts.showProgress
    ? ora({
        text: `fetching ${chalk.blue(startUrl)}`,
        spinner: 'dots'
      }).start()
    : null;

  try {
    // Process the starting URL
    await processUrl(startUrl, 0);
    
    // Process unprocessed links from the database
    let unprocessedLinks = db.getUnprocessedLinks();
    
    while (unprocessedLinks.length > 0 && pagesProcessed < (opts.maxPages ?? Infinity)) {
      const link = unprocessedLinks[0];
      
      try {
        const sourcePage = db.getPageById(link.sourceId);
        if (sourcePage) {
          // Resolve relative URLs against the source page URL
          const absoluteUrl = link.targetUrl.startsWith('http')
            ? link.targetUrl
            : resolveUrl(sourcePage.url, link.targetUrl);
            
          // Get the depth from the source page (stored as metadata in content)
          const sourceDepth = extractDepthFromContent(sourcePage.content) ?? 0;
          
          // Only process the link if it's within the max depth
          if (sourceDepth < (opts.maxDepth ?? Infinity)) {
            await processUrl(absoluteUrl, sourceDepth + 1);
          } else {
            if (spinner) {
              spinner.text = `${chalk.yellow('skipped')} ${chalk.dim(absoluteUrl)} (max depth reached)`;
            }
          }
        }
      } catch (error) {
        pagesWithErrors++;
        if (spinner) {
          spinner.text = `${chalk.red('error')} ${chalk.dim(link.targetUrl)}: ${(error as Error).message}`;
        }
      }
      
      // Mark the link as processed
      db.markLinkProcessed(link.id!);
      
      // Get the next batch of unprocessed links
      unprocessedLinks = db.getUnprocessedLinks();
    }
    
    // Final stats update
    const stats = db.getStats();
    if (spinner) {
      spinner.succeed(`${chalk.green('done')} processed ${chalk.bold(pagesProcessed.toString())} pages, ${pagesSkipped} skipped, ${pagesWithErrors} errors`);
    }
    console.log(`${chalk.dim('total in database:')} ${stats.pages} pages, ${stats.links} links`);
  } catch (error) {
    if (spinner) {
      spinner.fail(`${chalk.red('failed')}: ${(error as Error).message}`);
    }
    throw error;
  }
  
  /**
   * Processes a single URL by fetching its content and extracting links
   * 
   * @param url - The URL to process
   * @param depth - The current depth in the link tree
   * @returns A promise that resolves when the URL is processed
   */
  async function processUrl(url: string, depth: number): Promise<void> {
    // Check if the URL already exists in the database
    if (db.pageExists(url)) {
      pagesSkipped++;
      if (spinner) {
        spinner.text = `${chalk.yellow('skipped')} ${chalk.dim(url)} (already exists)`;
      }
      return;
    }
    
    // Update the spinner
    if (spinner) {
      spinner.text = `${chalk.blue('fetching')} ${chalk.dim(url)} (depth: ${depth})`;
    }
    
    // Fetch the content
    const content = await fetchContent(url);
    
    // If there was an error, log it and return
    if (content.error) {
      pagesWithErrors++;
      if (spinner) {
        spinner.text = `${chalk.red('error')} ${chalk.dim(url)}: ${content.error}`;
      }
      return;
    }
    
    // Add depth metadata to the content
    const contentWithDepth = addDepthToContent(content.markdown, depth);
    
    // Insert the page into the database
    const page: Page = {
      url: content.url,
      title: content.title,
      content: contentWithDepth,
      fetchedAt: new Date().toISOString()
    };
    
    const pageId = db.insertPage(page);
    pagesProcessed++;
    
    // Extract links from the content
    const links = extractLinks(content.markdown);
    
    // Insert the links into the database
    links.forEach(link => {
      db.insertLink({
        sourceId: pageId,
        targetUrl: link,
        processed: false
      });
    });
    
    // Update the spinner
    if (spinner) {
      spinner.text = `${chalk.green('processed')} ${chalk.dim(url)} (found ${links.length} links)`;
    }
  }
}

/**
 * Adds depth metadata to markdown content
 * 
 * @param content - The markdown content
 * @param depth - The depth value to add
 * @returns The content with depth metadata
 */
function addDepthToContent(content: string, depth: number): string {
  return `<!--depth:${depth}-->\n${content}`;
}

/**
 * Extracts depth metadata from markdown content
 * 
 * @param content - The markdown content
 * @returns The extracted depth or undefined if not found
 */
function extractDepthFromContent(content: string): number | undefined {
  const match = content.match(/<!--depth:(\d+)-->/);
  return match ? parseInt(match[1], 10) : undefined;
} 