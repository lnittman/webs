import { NextRequest, NextResponse } from 'next/server';
import { database as db } from '@repo/database';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find the shared link by token
    const sharedLink = await db.sharedLink.findFirst({
      where: {
        accessToken: token,
        isActive: true,
        // Check if not expired
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        chat: {
          include: {
            messages: {
              where: {
                // Get only messages up to the point of sharing
                // To do this, we need to limit to the messageCountAtShare
              },
              orderBy: {
                createdAt: 'asc'
              },
              take: 1000 // Limit the number of messages for performance
            }
          }
        },
        owner: {
          select: {
            id: true,
            clerkId: true
          }
        }
      }
    });

    if (!sharedLink) {
      return NextResponse.json(
        { error: 'Shared chat not found or link has expired' },
        { status: 404 }
      );
    }

    // Get authenticated user info if available
    const { userId } = auth();
    let currentUserInfo = null;

    if (userId) {
      const currentUser = await db.user.findFirst({
        where: { clerkId: userId }
      });
      
      if (currentUser) {
        currentUserInfo = {
          id: currentUser.id,
          clerkId: currentUser.clerkId,
          hideSharedWarning: currentUser.hideSharedWarning
        };
      }
    }

    // Get the messages limited to the count at sharing time
    const messages = await db.chatMessage.findMany({
      where: {
        chatId: sharedLink.chatId
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: sharedLink.messageCountAtShare
    });

    return NextResponse.json({
      id: sharedLink.id,
      chat: {
        id: sharedLink.chat.id,
        title: sharedLink.chat.title,
        messages: messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          type: msg.type,
          mode: msg.mode,
          createdAt: msg.createdAt
        }))
      },
      owner: {
        id: sharedLink.owner.id
      },
      messageCountAtShare: sharedLink.messageCountAtShare,
      currentUser: currentUserInfo,
      createdAt: sharedLink.createdAt,
      updatedAt: sharedLink.updatedAt,
      expiresAt: sharedLink.expiresAt
    });

  } catch (error) {
    console.error('Error fetching shared chat:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared chat' },
      { status: 500 }
    );
  }
} 