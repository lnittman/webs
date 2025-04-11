import { NextRequest, NextResponse } from 'next/server';
import { database as db } from '@repo/database';
import { auth, currentUser } from '@clerk/nextjs/server';
import { randomUUID } from 'crypto';

// Create a new shared link
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { chatId, expiresIn } = body;

    // Get the user from the database
    const user = await db.user.findFirst({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the chat exists and belongs to the user
    const chat = await db.chat.findFirst({
      where: {
        id: chatId,
        userId: user.id
      },
      include: {
        messages: {
          select: {
            id: true
          }
        }
      }
    });

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Calculate expiration date if provided
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date();
      if (expiresIn === '1d') {
        expiresAt.setDate(expiresAt.getDate() + 1);
      } else if (expiresIn === '7d') {
        expiresAt.setDate(expiresAt.getDate() + 7);
      } else if (expiresIn === '30d') {
        expiresAt.setDate(expiresAt.getDate() + 30);
      }
    }

    // Create a new shared link
    const accessToken = randomUUID().replace(/-/g, '');
    const sharedLink = await db.sharedLink.create({
      data: {
        chatId: chat.id,
        ownerId: user.id,
        accessToken,
        messageCountAtShare: chat.messages.length,
        expiresAt
      }
    });

    return NextResponse.json({
      id: sharedLink.id,
      chatId: sharedLink.chatId,
      accessToken: sharedLink.accessToken,
      messageCountAtShare: sharedLink.messageCountAtShare,
      createdAt: sharedLink.createdAt,
      expiresAt: sharedLink.expiresAt,
      url: `/share/${sharedLink.accessToken}`
    });

  } catch (error) {
    console.error('Error creating shared link:', error);
    return NextResponse.json(
      { error: 'Failed to create shared link' },
      { status: 500 }
    );
  }
}

// Get all shared links for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user from the database
    const user = await db.user.findFirst({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all shared links owned by the user
    const sharedLinks = await db.sharedLink.findMany({
      where: {
        ownerId: user.id,
        isActive: true
      },
      include: {
        chat: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(
      sharedLinks.map(link => ({
        id: link.id,
        chatId: link.chatId,
        chatTitle: link.chat.title,
        accessToken: link.accessToken,
        messageCountAtShare: link.messageCountAtShare,
        url: `/share/${link.accessToken}`,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
        expiresAt: link.expiresAt,
        isActive: link.isActive
      }))
    );

  } catch (error) {
    console.error('Error fetching shared links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared links' },
      { status: 500 }
    );
  }
} 