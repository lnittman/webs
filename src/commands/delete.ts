import { Command } from 'commander';
import DatabaseManager from '../lib/database';
import chalk from 'chalk';
import readline from 'readline';

export function deleteCommand(program: Command): void {
  program
    .command('delete <url>')
    .description('Delete a URL from the database')
    .option('-f, --force', 'Skip confirmation')
    .action(async (url: string, options: any) => {
      const db = DatabaseManager.getInstance();
      
      try {
        if (!db.pageExists(url)) {
          console.log(chalk.red(`URL not found in database: ${url}`));
          return;
        }
        
        if (!options.force) {
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });
          
          const answer = await new Promise<string>(resolve => {
            rl.question(chalk.yellow(`Are you sure you want to delete ${url}? (y/N) `), resolve);
          });
          
          rl.close();
          
          if (answer.toLowerCase() !== 'y') {
            console.log('Deletion cancelled.');
            return;
          }
        }
        
        const success = db.deletePage(url);
        
        if (success) {
          console.log(chalk.green(`Successfully deleted: ${url}`));
        } else {
          console.log(chalk.red(`Failed to delete: ${url}`));
        }
      } catch (error) {
        console.error(`Error deleting URL: ${(error as Error).message}`);
        process.exit(1);
      }
    });
} 