import { Command } from 'commander';
import DatabaseManager from '../lib/database';

export function listCommand(program: Command): void {
  program
    .command('list')
    .description('List all indexed URLs')
    .option('-s, --search <query>', 'Search for specific URLs')
    .option('-l, --limit <limit>', 'Limit the number of results', '50')
    .option('-d, --domain <domain>', 'Filter by domain')
    .option('-t, --tree', 'Show results in a tree view')
    .action(async (options: any) => {
      const db = DatabaseManager.getInstance();
      const limit = parseInt(options.limit, 10);
      
      try {
        const pages = db.getAllPages({ 
          limit, 
          search: options.search 
        });
        
        if (pages.length === 0) {
          console.log('No pages found in the database.');
          return;
        }
        
        console.log(`Found ${pages.length} pages:`);
        pages.forEach(page => {
          console.log(`- ${page.url} (${page.title})`);
        });
      } catch (error) {
        console.error(`Error listing pages: ${(error as Error).message}`);
        process.exit(1);
      }
    });
} 