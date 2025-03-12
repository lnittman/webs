import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { streamChatCompletion, generateEmbedding, AI_MODELS } from '@/lib/ai';
import { vectorSearch } from '@/lib/db';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Parse request body
    const { messages, workspaceId, modelId = AI_MODELS.GEMINI_2_FLASH } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages are required' }),
        { status: 400 }
      );
    }

    // Get the latest user message
    const latestMessage = messages[messages.length - 1];
    if (latestMessage.role !== 'user') {
      return new Response(
        JSON.stringify({ error: 'Last message must be from the user' }),
        { status: 400 }
      );
    }

    // Generate embedding for the query
    const embedding = await generateEmbedding(latestMessage.content);

    // Perform vector search to find relevant content
    let relevantPages = [];
    
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
        return new Response(
          JSON.stringify({ error: 'You do not have access to this workspace' }),
          { status: 403 }
        );
      }

      // Search within the specific workspace
      const results = await vectorSearch(embedding, 5);
      
      // Filter results by workspace
      relevantPages = await prisma.page.findMany({
        where: {
          id: { in: results.map((r: { id: string }) => r.id) },
          workspaceId,
        },
        select: {
          title: true,
          content: true,
          url: true,
        },
      });
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

      const workspaceIds = userWorkspaces.map((uw: { workspaceId: string }) => uw.workspaceId);

      // Search across all accessible workspaces
      const results = await vectorSearch(embedding, 5);
      
      // Get relevant pages
      relevantPages = await prisma.page.findMany({
        where: {
          id: { in: results.map(r => r.id) },
          workspaceId: { in: workspaceIds },
        },
        select: {
          title: true,
          content: true,
          url: true,
        },
      });
    }

    // Create context from relevant pages
    let context = '';
    if (relevantPages.length > 0) {
      context = relevantPages.map((page: { title: string, url: string, content: string }) => (
        `Title: ${page.title}\nURL: ${page.url}\n\n${page.content.substring(0, 1000)}...`
      )).join('\n\n---\n\n');
    }

    // Create system message with context
    const systemMessage = {
      role: 'system',
      content: `You are a helpful assistant that answers questions based on the user's web content.
      
      ${relevantPages.length > 0 ? 'Here is some relevant content from the user\'s database:' : 'The user has not indexed any relevant content for this query.'}
      
      ${context}
      
      When answering:
      1. Use the provided content to inform your answers
      2. If the content doesn't contain relevant information, say so
      3. Cite the sources (URLs) when referencing specific information
      4. Be concise and helpful`
    };

    // Create the full message array with the system message
    const fullMessages = [systemMessage, ...messages];

    // Stream the response
    return streamChatCompletion(fullMessages, modelId);
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
} 