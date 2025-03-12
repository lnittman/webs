import { NextRequest, NextResponse } from 'next/server';
import { fetchContent, storeContent } from '@/lib/fetcher';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateSummary } from '@/lib/ai';

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
    const { url, workspaceId, generateSummaryFlag } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

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

    // Fetch content
    const content = await fetchContent(url);

    if (content.error) {
      return NextResponse.json(
        { error: `Failed to fetch content: ${content.error}` },
        { status: 500 }
      );
    }

    // Store content in the database
    const pageId = await storeContent(content, workspaceId, session.user.id);

    // Generate summary if requested
    let summary = null;
    if (generateSummaryFlag) {
      summary = await generateSummary(content.markdown);
      
      // Store summary in the database
      await prisma.summary.create({
        data: {
          title: content.title,
          overview: summary,
          keyTopics: [],
          pageId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      pageId,
      title: content.title,
      url: content.url,
      summary,
    });
  } catch (error) {
    console.error('Error in fetch API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 