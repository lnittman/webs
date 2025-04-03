import { DurableObjectNamespace, Request, Response, VectorizeIndex } from '@cloudflare/workers-types';
import { AgentDO } from './agent-do'; // This will be created in the next step

// Define the environment bindings and secrets expected by the Worker
export interface Env {
  // Durable Object binding
  AGENTS_DO: DurableObjectNamespace;

  // Vectorize binding
  VECTORIZE_INDEX: VectorizeIndex;

  // Secrets (ensure these are set via `wrangler secret put`)
  OPENROUTER_API_KEY: string;
  SHARED_AUTH_SECRET: string;
  CLOUDFLARE_ACCOUNT_ID: string; // Might not be strictly needed if using bindings
  CLOUDFLARE_API_TOKEN: string; // Might not be strictly needed if using bindings
  UPSTASH_URL: string;
  UPSTASH_TOKEN: string;

  // Add any other necessary environment variables/secrets here
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // 1. Authentication
    const authHeader = request.headers.get('Authorization');
    const expectedToken = `Bearer ${env.SHARED_AUTH_SECRET}`;

    if (!authHeader || authHeader !== expectedToken) {
      console.error('Authentication failed: Invalid or missing Authorization header.');
      return new Response('Unauthorized', { status: 401 });
    }

    // 2. Extract Chat ID
    const chatId = request.headers.get('X-Chat-ID');
    if (!chatId) {
      console.error('Bad Request: Missing X-Chat-ID header.');
      return new Response('Missing X-Chat-ID header', { status: 400 });
    }

    // Basic validation for chatId (e.g., non-empty string)
    // You might want more robust validation depending on your ID format
    if (typeof chatId !== 'string' || chatId.trim() === '') {
        console.error('Bad Request: Invalid X-Chat-ID header.');
        return new Response('Invalid X-Chat-ID header', { status: 400 });
    }

    try {
      // 3. Derive Durable Object ID
      const doId = env.AGENTS_DO.idFromName(chatId);

      // 4. Get Durable Object Stub
      const doStub = env.AGENTS_DO.get(doId);

      // 5. Forward the request to the Durable Object instance
      // The DO's fetch method will handle the specific logic (e.g., /stream, /feedback)
      // Note: We are NOT passing the `env` object directly to the DO's fetch.
      // The DO constructor receives `env` upon instantiation.
      console.log(`Forwarding request for chat ID ${chatId} to DO ${doId.toString()}`);
      return await doStub.fetch(request);

    } catch (error) {
      console.error(`Error processing request for chat ID ${chatId}:`, error);
      // Avoid exposing detailed errors to the client in production
      const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
      // Check if it's a known DO error type if needed, otherwise generic 500
      return new Response(`Failed to process request: ${errorMessage}`, { status: 500 });
    }
  },
};

// Export the Durable Object class itself, so Wrangler can find and instantiate it.
export { AgentDO };