import { NextRequest, NextResponse } from 'next/server';
import { database as db } from '@repo/database';
import { currentUser, auth } from '@clerk/nextjs/server';
import { randomUUID } from 'crypto';
import { resend, createInviteEmail } from '@repo/email';
import { addDays } from 'date-fns';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: chatId } = params;
    const body = await req.json();
    const { emails, role = 'PARTICIPANT' } = body;

    if (!chatId || !emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Chat ID and emails array are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['OWNER', 'MODERATOR', 'PARTICIPANT', 'VIEWER'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid participant role' },
        { status: 400 }
      );
    }

    // Get the current user for attribution
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
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

    // Check if the chat exists and the user is the owner or moderator
    const chat = await db.chat.findFirst({
      where: {
        id: chatId,
        OR: [
          { userId: dbUser.id }, // User is owner
          {
            participants: {
              some: {
                userId: dbUser.id,
                role: {
                  in: ['OWNER', 'MODERATOR']
                },
                isActive: true
              }
            }
          }
        ]
      },
      include: {
        participants: {
          where: {
            isActive: true
          }
        }
      }
    });

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found or you do not have permission to invite users' },
        { status: 404 }
      );
    }

    // Create invites for each email
    const inviteResults = await Promise.all(
      emails.map(async (email: string) => {
        try {
          const trimmedEmail = email.toLowerCase().trim();
          
          // Check if there's already an active participant with this email
          const isAlreadyParticipant = chat.participants.some(p => 
            p.inviteEmail?.toLowerCase() === trimmedEmail
          );

          if (isAlreadyParticipant) {
            return {
              email: trimmedEmail,
              status: 'skipped',
              message: 'Already a participant'
            };
          }

          // Check if user exists with this email in Clerk
          // This is a simplified example - in reality you would need
          // to use Clerk's API to look up users by email
          const existingUser = await db.user.findFirst({
            where: {
              clerkId: { contains: trimmedEmail }
            }
          });

          // Generate invite token
          const inviteToken = randomUUID();
          const expiresAt = addDays(new Date(), 7); // 7 days expiration

          // Create participant with pending status
          const participant = await db.chatParticipant.create({
            data: {
              chatId,
              userId: existingUser?.id || dbUser.id, // Temporary until accepted
              role: role as any,
              invitedBy: dbUser.id,
              inviteToken,
              inviteEmail: trimmedEmail,
              isActive: false, // Will be activated when accepted
            }
          });

          // Generate the invite URL
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const inviteUrl = `${baseUrl}/invite/${inviteToken}`;

          // Send the invitation email
          await resend.emails.send({
            from: 'Webs <noreply@yourwebsplatform.com>',
            to: trimmedEmail,
            subject: `${user.firstName || 'Someone'} invited you to join a chat on Webs`,
            react: createInviteEmail({
              inviterName: user.firstName || 'A Webs user',
              chatTitle: chat.title,
              inviteLink: inviteUrl
            })
          });

          return {
            email: trimmedEmail,
            status: 'sent',
            isExistingUser: !!existingUser,
            participantId: participant.id
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