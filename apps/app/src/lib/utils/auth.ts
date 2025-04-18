import { database as db } from '@repo/database';
import { auth } from '@clerk/nextjs/server';

/**
 * Gets or creates a user record in our database for the authenticated Clerk user
 * This function is used to bridge Clerk authentication with our database models
 */
export async function getOrCreateUserRecord() {
  const { userId: clerkId } = await auth();
  
  if (!clerkId) {
    throw new Error('Not authenticated');
  }
  
  // Check if the user record already exists
  const existingUser = await db.user.findUnique({
    where: { clerkId }
  });
  
  // If exists, return it
  if (existingUser) {
    return existingUser;
  }
  
  // Otherwise create a minimal user record
  const newUser = await db.user.create({
    data: { clerkId }
  });
  
  return newUser;
} 