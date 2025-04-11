import { NextRequest, NextResponse } from 'next/server';
import { database as db } from '@repo/database';
import { getOrCreateUserRecord } from '@/lib/auth-utils';
import { put } from '@repo/storage';
import { keys } from '@repo/storage/keys';

// GET - Retrieve all projects for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const user = await getOrCreateUserRecord();
    
    // Get all projects for this user
    const projects = await db.project.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        _count: {
          select: {
            chats: true
          }
        },
        chats: {
          take: 5, // Only get 5 most recent chats for preview
          orderBy: {
            updatedAt: 'desc'
          },
          select: {
            id: true,
            title: true,
            updatedAt: true
          }
        }
      }
    });
    
    return NextResponse.json(projects);
  } catch (error) {
    console.error('[API] Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// Helper function to generate a UUID
function newUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// POST - Create a new project
export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const user = await getOrCreateUserRecord();
    
    // Parse the request body
    const body = await request.json();
    
    // Validate the request body
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }
    
    // Prepare data for project creation
    const projectData: any = {
      name: body.name,
      user: {
        connect: {
          id: user.id
        }
      }
    };
    
    // Add description if provided
    if (body.description) {
      projectData.description = body.description;
    }
    
    // Handle image data if provided
    if (body.imageBase64) {
      try {
        // Convert base64 to Buffer
        const imageBuffer = Buffer.from(body.imageBase64.split(',')[1], 'base64');
        
        // Generate a filename with UUID to avoid collisions
        const fileName = `project-${newUUID()}.png`;
        
        // Upload to Vercel Blob store
        const blob = await put(
          fileName, 
          imageBuffer, 
          {
            access: 'public',
            contentType: 'image/png', // Assuming PNG, adjust as needed
            token: keys().BLOB_READ_WRITE_TOKEN
          }
        );
        
        // Store the URL in the database instead of the base64 data
        projectData.imageUrl = blob.url;
        console.log('[API] Image uploaded to Blob storage for new project');
      } catch (imageError) {
        console.error('[API] Error processing image data:', imageError);
        // Continue without image if there's an error
      }
    }
    
    // Create a new project
    const newProject = await db.project.create({
      data: projectData
    });
    
    return NextResponse.json(newProject);
  } catch (error) {
    console.error('[API] Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
} 