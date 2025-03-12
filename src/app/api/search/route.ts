import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateEmbedding } from '@/lib/ai';
import { vectorSearch } from '@/lib/db';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { query, workspaceId, limit = 10 } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Generate embedding for the query
    const embedding = await generateEmbedding(query);

    // Perform vector search
    let results;
    
    if (workspaceId) {
      // Check if the user has access to the workspace
      const workspace = await prisma.userWorkspace.findUnique({
        where: {
          userId_workspaceId: {
            userId: session.user.id,
            workspaceId,
          },
        },
      });

      if (!workspace) {
        return NextResponse.json(
          { error: 'You do not have access to this workspace' },
          { status: 403 }
        );
      }

      // Search within the specific workspace
      results = await vectorSearch(embedding, limit);
      
      // Filter results by workspace
      results = results.filter(result => result.workspaceId === workspaceId);
    } else {
      // Get all workspaces the user has access to
      const userWorkspaces = await prisma.userWorkspace.findMany({
        where: {
          userId: session.user.id,
        },
        select: {
          workspaceId: true,
        },
      });

      const workspaceIds = userWorkspaces.map(uw => uw.workspaceId);

      // Search across all accessible workspaces
      results = await vectorSearch(embedding, limit);
      
      // Filter results by accessible workspaces
      results = results.filter(result => workspaceIds.includes(result.workspaceId));
    }

    // Format results
    const formattedResults = await Promise.all(
      results.map(async (result) => {
        // Get page details
        const page = await prisma.page.findUnique({
          where: { id: result.id },
          select: {
            id: true,
            url: true,
            title: true,
            fetchedAt: true,
            workspace: {
              select: {
                id: true,
                name: true,
              },
            },
            summary: {
              select: {
                overview: true,
              },
            },
          },
        });

        if (!page) return null;

        return {
          id: page.id,
          url: page.url,
          title: page.title,
          fetchedAt: page.fetchedAt,
          workspace: page.workspace,
          summary: page.summary?.overview,
          similarity: result.similarity,
        };
      })
    );

    // Remove null results
    const filteredResults = formattedResults.filter(Boolean);

    return NextResponse.json({
      results: filteredResults,
    });
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 