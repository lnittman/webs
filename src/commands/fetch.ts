import { Command } from 'commander';
import { processQueue } from '../lib/queue';

export function fetchCommand(program: Command): void {
  program
    .command('fetch <url>')
    .description('Fetch content from a URL and store it in the database')
    .option('-d, --depth <depth>', 'Maximum depth to crawl', '1')
    .option('-m, --max-pages <maxPages>', 'Maximum number of pages to fetch', '100')
    .option('-q, --quiet', 'Disable progress output')
    .action(async (url: string, options: any) => {
      const maxDepth = parseInt(options.depth, 10);
      const maxPages = parseInt(options.maxPages, 10);
      const showProgress = !options.quiet;

      try {
        await processQueue(url, { maxDepth, maxPages, showProgress });
      } catch (error) {
        console.error(`Error fetching content: ${(error as Error).message}`);
        process.exit(1);
      }
    });
} 