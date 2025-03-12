import { PrismaClient } from '@prisma/client';

// Create a singleton PrismaClient instance
export const prisma = new PrismaClient();

// Page interfaces
export interface PageCreateInput {
  url: string;
  title: string;
  content: string;
  workspaceId?: string;
}

export interface LinkCreateInput {
  sourceId: string;
  targetUrl: string;
}

// Database operations

// Pages
export async function getPageByUrl(url: string) {
  return prisma.page.findUnique({
    where: { url },
    include: { links: true }
  });
}

export async function createPage(data: PageCreateInput) {
  return prisma.page.create({
    data,
    include: { links: true }
  });
}

export async function updatePage(id: string, data: Partial<PageCreateInput>) {
  return prisma.page.update({
    where: { id },
    data,
    include: { links: true }
  });
}

export async function deletePage(id: string) {
  return prisma.page.delete({
    where: { id }
  });
}

export async function getPagesForWorkspace(workspaceId: string) {
  return prisma.page.findMany({
    where: { workspaceId },
    include: { links: true }
  });
}

// Links
export async function createLink(data: LinkCreateInput) {
  return prisma.link.create({
    data
  });
}

export async function getUnprocessedLinks() {
  return prisma.link.findMany({
    where: { processed: false }
  });
}

export async function markLinkProcessed(id: string) {
  return prisma.link.update({
    where: { id },
    data: { processed: true }
  });
}

// Workspaces
export async function createWorkspace(name: string, description?: string, userId?: string) {
  const workspace = await prisma.workspace.create({
    data: {
      name,
      description
    }
  });

  if (userId) {
    await prisma.workspaceUser.create({
      data: {
        workspaceId: workspace.id,
        userId,
        role: 'owner'
      }
    });
  }

  return workspace;
}

export async function getUserWorkspaces(userId: string) {
  return prisma.workspace.findMany({
    where: {
      users: {
        some: {
          userId
        }
      }
    },
    include: {
      users: true,
      pages: {
        select: {
          id: true,
          url: true,
          title: true
        }
      }
    }
  });
}

// Cleanup
export async function disconnect() {
  await prisma.$disconnect();
} 