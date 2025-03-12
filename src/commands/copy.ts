import { Command } from 'commander';
import DatabaseManager from '../lib/database';
import clipboardy from 'clipboardy';
import chalk from 'chalk';

export function copyCommand(program: Command): void {
  program
    .command('copy <domain>')
    .description('Copy content from a domain to the clipboard')
    .option('-f, --format <format>', 'Output format (markdown, text, json)', 'markdown')
    .option('-t, --title', 'Include title in the output')
    .option('-d, --date', 'Include fetch date in the output')
    .action(async (domain: string, options: any) => {
      const db = DatabaseManager.getInstance();
      
      try {
        // Parse domain and path
        let path: string | undefined;
        if (domain.includes('/')) {
          const parts = domain.split('/', 2);
          domain = parts[0];
          path = parts[1];
        }
        
        const content = db.getContentByDomainAndPath(domain, path, {
          includeTitle: options.title,
          includeFetchDate: options.date,
          format: options.format
        });
        
        if (!content) {
          console.log(chalk.red(`No content found for domain: ${domain}${path ? '/' + path : ''}`));
          return;
        }
        
        await clipboardy.write(content);
        console.log(chalk.green('Content copied to clipboard!'));
      } catch (error) {
        console.error(`Error copying content: ${(error as Error).message}`);
        process.exit(1);
      }
    });
} 