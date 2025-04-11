import { NextRequest, NextResponse } from 'next/server';
import { database as db } from '@repo/database';
import { auth } from '@clerk/nextjs/server';

// Get invitation details
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

    // Find the invitation by token
    const invitation = await db.chatParticipant.findFirst({
      where: {
        inviteToken: token,
        isActive: false // Not yet accepted
      },
      include: {
        chat: {
          select: {
            id: true,
            title: true,
            userId: true
          }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or has already been used' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      participantId: invitation.id,
      chatId: invitation.chatId,
      chatTitle: invitation.chat.title,
      inviteEmail: invitation.inviteEmail,
      role: invitation.role
    });

  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 }
    );
  }
}

// Accept invitation
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'You must be logged in to accept an invitation' },
        { status: 401 }
      );
    }

    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
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

    // Find the invitation by token
    const invitation = await db.chatParticipant.findFirst({
      where: {
        inviteToken: token,
        isActive: false // Not yet accepted
      },
      include: {
        chat: true
      }
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or has already been used' },
        { status: 404 }
      );
    }

    // Check if the user email matches the invitation email
    // This is a simplified check - in reality you would need
    // to validate against Clerk's user email array
    if (invitation.inviteEmail && !userId.toLowerCase().includes(invitation.inviteEmail.toLowerCase())) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address' },
        { status: 403 }
      );
    }

    // Activate the participant record with the correct user ID
    const updatedParticipant = await db.chatParticipant.update({
      where: { id: invitation.id },
      data: {
        userId: user.id,
        isActive: true,
        inviteToken: null // Clear the token so it can't be reused
      }
    });

    return NextResponse.json({
      success: true,
      participantId: updatedParticipant.id,
      chatId: invitation.chatId,
      chatTitle: invitation.chat.title,
      role: updatedParticipant.role
    });

  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
} 