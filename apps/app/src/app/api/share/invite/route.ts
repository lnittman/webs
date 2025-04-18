import { NextRequest, NextResponse } from 'next/server';
import { database as db } from '@repo/database';
import { auth, currentUser } from '@clerk/nextjs/server';
import { nanoid } from 'nanoid';
import { resend, createInviteEmail } from '@repo/email';
import { addDays } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { sharedChatId, emails } = body;

    if (!sharedChatId || !emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'SharedChatId and emails array are required' },
        { status: 400 }
      );
    }

    // Get the user from the database
    const dbUser = await db.user.findFirst({
      where: { clerkId: userId }
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User record not found' },
        { status: 404 }
      );
    }

    // Get the shared chat
    const sharedChat = await db.sharedChat.findFirst({
      where: {
        id: sharedChatId,
        ownerId: dbUser.id
      },
      include: {
        chat: true
      }
    });

    if (!sharedChat) {
      return NextResponse.json(
        { error: 'Shared chat not found or you are not the owner' },
        { status: 404 }
      );
    }

    // Create invites for each email
    const inviteResults = await Promise.all(
      emails.map(async (email: string) => {
        try {
          // Check if the user already exists
          const existingUser = await db.user.findFirst({
            where: {
              OR: [
                // This assumes users can have multiple email addresses in Clerk
                // You would need to modify this based on your actual data structure
                { clerkId: { contains: email.toLowerCase() } }
              ]
            }
          });

          // Generate invite token and expiration date
          const inviteToken = nanoid(24);
          const expiresAt = addDays(new Date(), 7); // 7 days expiration

          // Create or update invitation
          const invite = await db.chatInvite.create({
            data: {
              email: email.toLowerCase(),
              sharedChatId: sharedChat.id,
              inviteToken,
              expiresAt
            }
          });

          // Generate the invite URL
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const inviteUrl = `${baseUrl}/invite/${inviteToken}`;

          // Send the invitation email
          await resend.emails.send({
            from: 'Webs <noreply@yourwebsplatform.com>',
            to: email,
            subject: `${user.firstName || 'Someone'} invited you to join a chat on Webs`,
            react: createInviteEmail({
              inviterName: user.firstName || 'A Webs user',
              chatTitle: sharedChat.chat.title,
              inviteLink: inviteUrl
            })
          });

          return {
            email,
            status: 'sent',
            isExistingUser: !!existingUser,
            inviteId: invite.id
          };
        } catch (error) {
          console.error(`Failed to send invite to ${email}:`, error);
          return {
            email,
            status: 'failed',
            error: (error as Error).message
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      results: inviteResults
    });

  } catch (error) {
    console.error('Error sending invites:', error);
    return NextResponse.json(
      { error: 'Failed to send invites' },
      { status: 500 }
    );
  }
} 