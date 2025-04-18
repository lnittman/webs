import { NextRequest, NextResponse } from 'next/server';
import { database as db } from '@repo/database';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUserRecord } from '@/src/lib/utils/auth';

// GET - List all chats for the current user
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get or create the user record
    const user = await getOrCreateUserRecord();

    // Get all chats for the user
    const chats = await db.chat.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1 // Just get the first message to help with titles
        }
      }
    });

    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}

// POST - Create a new chat
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get the request body
    const { title, message, projectId } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Get or create the user record
    const user = await getOrCreateUserRecord();
    
    // Verify project exists and belongs to user if projectId is provided
    if (projectId) {
      const project = await db.project.findUnique({
        where: { 
          id: projectId,
          userId: user.id
        }
      });
      
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found or not accessible' },
          { status: 404 }
        );
      }
    }

    // Create a new chat
    const chat = await db.chat.create({
      data: {
        title,
        userId: user.id,
        projectId, // This will be null if not provided
        ...(message ? {
          messages: {
            create: {
              content: message,
              type: 'user',
              userId: user.id
            }
          }
        } : {})
      },
      include: {
        messages: true
      }
    });

    return NextResponse.json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    );
  }
} 