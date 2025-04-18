import { MastraClient } from '@mastra/client-js';

// Initialize the client
export const mastra = new MastraClient({
  baseUrl: 'http://localhost:4111',
});
