import { Command } from 'commander';
import DatabaseManager from '../lib/database';
import chalk from 'chalk';
import readline from 'readline';

export function cleanCommand(program: Command): void {
  program
    .command('clean')
    .description('Clean the database by removing broken links')
    .option('-f, --force', 'Skip confirmation')
    .action(async (options: any) => {
      const db = DatabaseManager.getInstance();
      
      try {
        if (!options.force) {
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });
          
          const answer = await new Promise<string>(resolve => {
            rl.question(chalk.yellow('Are you sure you want to clean the database? This will remove broken links. (y/N) '), resolve);
          });
          
          rl.close();
          
          if (answer.toLowerCase() !== 'y') {
            console.log('Clean operation cancelled.');
            return;
          }
        }
        
        const result = db.cleanDatabase();
        
        console.log(chalk.green(`Database cleaned successfully!`));
        console.log(`Removed ${result.removedLinks} broken links.`);
        console.log(`Removed ${result.removedUnprocessedLinks} unprocessed links.`);
      } catch (error) {
        console.error(`Error cleaning database: ${(error as Error).message}`);
        process.exit(1);
      }
    });
} 