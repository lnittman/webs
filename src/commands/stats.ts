import { Command } from 'commander';
import DatabaseManager from '../lib/database';
import chalk from 'chalk';

export function statsCommand(program: Command): void {
  program
    .command('stats')
    .description('Show database statistics')
    .option('-j, --json', 'Output in JSON format')
    .action((options: any) => {
      const db = DatabaseManager.getInstance();
      
      try {
        const stats = db.getStats();
        
        if (options.json) {
          console.log(JSON.stringify(stats, null, 2));
          return;
        }
        
        console.log(chalk.bold('\n📊 Database Statistics'));
        console.log(chalk.blue('─────────────────────'));
        console.log(`📄 Pages: ${chalk.green(stats.pages.toString())}`);
        console.log(`🔗 Links: ${chalk.green(stats.links.toString())}`);
        console.log(`⏳ Unprocessed Links: ${chalk.yellow(stats.unprocessedLinks.toString())}`);
        console.log(chalk.blue('─────────────────────\n'));
      } catch (error) {
        console.error(`Error getting statistics: ${(error as Error).message}`);
        process.exit(1);
      }
    });
} 