declare module '@neondatabase/serverless' {
  export class Pool {
    constructor(options: { connectionString: string });
    connect(): Promise<any>;
    end(): Promise<void>;
  }
}

declare module '@prisma/adapter-neon' {
  export class PrismaNeon {
    constructor(pool: any);
  }
}

declare module '@vercel/postgres' {
  type SqlQueryResult = {
    rows: any[];
  };

  // Define a template tag function type
  type SqlTag = {
    (template: TemplateStringsArray, ...args: any[]): Promise<SqlQueryResult>;
    query: (text: string, values?: any[]) => Promise<SqlQueryResult>;
  };

  export function createClient(): SqlTag;
} 