import { NextRequest, NextResponse } from 'next/server';
import { database as db } from '@repo/database';
import { auth } from '@clerk/nextjs/server';

// Helper to verify user owns the chat
async function verifyAccess(chatId: string, clerkId: string) {
  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true }
  });

  if (!user) {
    return { error: 'User not found', status: 404 };
  }

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

// GET - Get a single chat by ID
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
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
    
    const access = await verifyAccess(chatId, userId);
    
    if ('error' in access) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    // Get the chat with messages
    const chat = await db.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return NextResponse.json(chat);
  } catch (error) {
    console.error(`Error fetching chat:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch chat' },
      { status: 500 }
    );
  }
}

// PUT - Update a chat
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
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
    
    const access = await verifyAccess(chatId, userId);
    
    if ('error' in access) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    // Get the request body
    const { title } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Update the chat
    const updatedChat = await db.chat.update({
      where: { id: chatId },
      data: { title },
      include: { messages: true }
    });

    return NextResponse.json(updatedChat);
  } catch (error) {
    console.error(`Error updating chat:`, error);
    return NextResponse.json(
      { error: 'Failed to update chat' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a chat
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
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
    
    const access = await verifyAccess(chatId, userId);
    
    if ('error' in access) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    // Delete the chat and all related messages (cascades in Prisma schema)
    await db.chat.delete({
      where: { id: chatId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting chat:`, error);
    return NextResponse.json(
      { error: 'Failed to delete chat' },
      { status: 500 }
    );
  }
} 