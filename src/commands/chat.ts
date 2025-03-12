import { Command } from 'commander';
import { startChatSession } from '../lib/chat';

export function chatCommand(program: Command): void {
  program
    .command('chat')
    .description('Start an interactive chat session about your indexed content')
    .option('-d, --domain <domain>', 'Focus on a specific domain')
    .option('-p, --path <path>', 'Focus on a specific path within a domain')
    .option('-m, --model <model>', 'AI model to use (gemini, claude, gpt-4, etc.)')
    .option('-c, --context-limit <limit>', 'Maximum context size in characters', '10000')
    .action(async (options: any) => {
      try {
        await startChatSession({
          domain: options.domain,
          path: options.path,
          model: options.model,
          contextLimit: parseInt(options.contextLimit, 10)
        });
      } catch (error) {
        console.error(`Error in chat session: ${(error as Error).message}`);
        process.exit(1);
      }
    });
} 