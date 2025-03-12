// Use the Prisma Client from @prisma/client
import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  (() => {
    // For development, use regular Prisma client
    return new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  })();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Stub implementation for vector search
export async function vectorSearch(embedding: number[], limit = 5) {
  console.warn('vectorSearch is not implemented in the CLI version');
  return [];
}

// Stub function to create vector embedding
export async function createEmbedding(text: string): Promise<number[]> {
  console.warn('createEmbedding is not implemented in the CLI version');
  return Array(1536).fill(0).map(() => Math.random());
} 