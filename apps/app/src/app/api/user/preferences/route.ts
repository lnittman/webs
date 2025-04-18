import { NextRequest, NextResponse } from 'next/server';
import { database as db } from '@repo/database';
import { auth, currentUser } from '@clerk/nextjs/server';

// Update user preferences
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { hideSharedWarning } = body;

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

    // Update the user preferences
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        hideSharedWarning: hideSharedWarning ?? user.hideSharedWarning
      }
    });

    return NextResponse.json({
      hideSharedWarning: updatedUser.hideSharedWarning
    });

  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update user preferences' },
      { status: 500 }
    );
  }
}

// Get user preferences
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

    return NextResponse.json({
      hideSharedWarning: user.hideSharedWarning
    });

  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user preferences' },
      { status: 500 }
    );
  }
} 