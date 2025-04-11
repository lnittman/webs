import 'server-only';

import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaClient } from './generated/client';
import ws from 'ws';
import { keys } from './keys';

// Configure neon for WebSocket support
neonConfig.webSocketConstructor = ws;

// Create a database connection pool
const pool = new Pool({ connectionString: keys().DATABASE_URL });

// Create a singleton PrismaClient instance
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const database = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = database;
}

// Export types from Prisma client
export * from './generated/client';
