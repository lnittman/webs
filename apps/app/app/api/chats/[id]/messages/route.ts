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

// GET - Get messages for a chat
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

    // Get messages for the chat
    const messages = await db.chatMessage.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages for chat:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST - Add a message to a chat
export async function POST(
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
    const { content, type, mode } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (!type || !['user', 'ai', 'system'].includes(type)) {
      return NextResponse.json(
        { error: 'Valid type is required (user, ai, or system)' },
        { status: 400 }
      );
    }

    // Create the message
    const message = await db.chatMessage.create({
      data: {
        content,
        type,
        mode,
        chatId,
        userId: access.userId
      }
    });

    // Update the chat's updatedAt timestamp
    await db.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error adding message to chat:', error);
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    );
  }
} 