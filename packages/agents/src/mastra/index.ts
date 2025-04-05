import { Mastra } from '@mastra/core';
import { createLogger } from '@mastra/core/logger';

import * as tools from './tools';
import * as workflows from './workflows';

// Create a logger with less verbose level to reduce output
const logger = createLogger({
  name: 'MastraAgents',
  level: 'debug'
});

logger.info('Initializing Mastra agents package');

// Create the Mastra instance with our components
// @ts-ignore - Type annotation not portable but works at runtime
export const mastra = new Mastra({
  workflows: workflows,
  logger,
});

// Export components for direct access
export { tools, workflows };
        