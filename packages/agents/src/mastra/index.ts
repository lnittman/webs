import { Mastra } from '@mastra/core';
import { createLogger } from '@mastra/core/logger';
import { Memory } from '@mastra/memory';

import { mainAgent } from './agents/main';
import * as tools from './tools';
import * as workflows from './workflows';

// Create a logger with less verbose level to reduce output
const logger = createLogger({
  name: 'MastraAgents',
  level: 'info'  // Changed from 'debug' to 'info' to reduce log verbosity
});

// Override console.log to add prefixes for better debugging
const originalConsoleLog = console.log;
console.log = function(...args) {
  if (typeof args[0] === 'string' && !args[0].startsWith('[')) {
    return originalConsoleLog(`[INFO] [MastraHelpers]`, ...args);
  }
  return originalConsoleLog(...args);
};

// Override console.error for consistent logging
const originalConsoleError = console.error;
console.error = function(...args) {
  if (typeof args[0] === 'string' && !args[0].startsWith('[')) {
    return originalConsoleError(`[ERROR] [MastraHelpers]`, ...args);
  }
  return originalConsoleError(...args);
};

logger.info('Initializing Mastra agents package');

// Create the Mastra instance with our components
// @ts-ignore - Type annotation not portable but works at runtime
export const mastra = new Mastra({
  agents: {
    mainAgent
  },
  workflows: workflows,
  logger,
});

// Export components for direct access
export { tools, mainAgent, workflows };
        