declare module 'openrouter-sdk' {
  export class OpenRouter {
    constructor(options: { apiKey: string; baseURL?: string });
    chat: {
      completions: {
        create: (options: any) => Promise<any>;
      };
    };
    embeddings: {
      create: (options: any) => Promise<any>;
    };
  }
} 