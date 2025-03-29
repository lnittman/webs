import 'server-only';

import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaClient } from '@prisma/client';
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

// Custom interfaces for database operations
export interface CustomPageInput {
  url: string;
  title: string;
  content: string;
  links?: CustomLinkInput[];
  workspaceId?: string;
}

export interface CustomLinkInput {
  sourceId: string;
  targetUrl: string;
}

// Database operations

// Pages
export async function getPageByUrl(url: string) {
  return database.page.findUnique({
    where: { url },
    include: { links: true }
  });
}

export async function createPage(pageData: CustomPageInput) {
  const { links, ...pageInfo } = pageData;
  
  return database.page.create({
    data: {
      ...pageInfo,
      // Handle links if provided
      ...(links && links.length > 0 && {
        links: {
          create: links
        }
      })
    },
    include: { links: true }
  });
}

export async function updatePage(id: string, pageData: Partial<CustomPageInput>) {
  const { links, ...pageInfo } = pageData;
  
  return database.page.update({
    where: { id },
    data: {
      ...pageInfo,
      // Handle links if provided
      ...(links && links.length > 0 && {
        links: {
          create: links
        }
      })
    },
    include: { links: true }
  });
}

export async function deletePage(id: string) {
  return database.page.delete({
    where: { id }
  });
}

// Links
export async function createLink(data: CustomLinkInput) {
  return database.link.create({
    data
  });
}

export async function getUnprocessedLinks() {
  return database.link.findMany({
    where: { processed: false }
  });
}

export async function markLinkProcessed(id: string) {
  return database.link.update({
    where: { id },
    data: { processed: true }
  });
}

// Workspace operations
export async function getWorkspaces() {
  return database.workspace.findMany({
    include: { users: true }
  });
}

export async function getWorkspaceById(id: string) {
  return database.workspace.findUnique({
    where: { id },
    include: { users: true, pages: true }
  });
}

export async function createWorkspace(name: string, description?: string) {
  return database.workspace.create({
    data: {
      name,
      description
    }
  });
}

// User-related operations
export async function getUserWorkspaces(userId: string) {
  return database.workspace.findMany({
    where: {
      users: {
        some: {
          userId
        }
      }
    },
    include: {
      users: true
    }
  });
}

// Export types from Prisma client
export * from '@prisma/client';
