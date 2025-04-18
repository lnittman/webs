import { NextRequest, NextResponse } from 'next/server';
import { database as db } from '@repo/database';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUserRecord } from '@/src/lib/utils/auth';

// Helper to verify user owns the chat
async function verifyAccess(chatId: string) {
  // Get or create the user record
  const user = await getOrCreateUserRecord();

  const chat = await db.chat.findUnique({
    where: { id: chatId },
    select: { userId: true }
  });

  if (!chat) {
    return { error: 'Chat not found', status: 404 };
  }

  if (chat.userId !== user.id) {
    return { error: 'Not authorized to access this chat', status: 403 };
  }

  return { userId: user.id };
}

// PUT - Assign chat to a project
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Properly await params before accessing its properties
    const params = await context.params;
    const chatId = params.id;
    
    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      );
    }
    
    const access = await verifyAccess(chatId);
    
    if ('error' in access) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    // Get the request body
    const { projectId } = await request.json();

    // If projectId is provided, verify the project exists and belongs to the user
    if (projectId) {
      const project = await db.project.findUnique({
        where: { 
          id: projectId,
          userId: access.userId
        }
      });
      
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found or not accessible' },
          { status: 404 }
        );
      }
    }

    // Update the chat with the new project assignment
    const updatedChat = await db.chat.update({
      where: { id: chatId },
      data: { 
        projectId: projectId || null // Allow removing from project if projectId is null
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(updatedChat);
  } catch (error) {
    console.error('Error assigning chat to project:', error);
    return NextResponse.json(
      { error: 'Failed to assign chat to project' },
      { status: 500 }
    );
  }
} 