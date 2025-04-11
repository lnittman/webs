import { NextRequest, NextResponse } from 'next/server';
import { database as db } from '@repo/database';
import { getOrCreateUserRecord } from '@/lib/auth-utils';
import { put } from '@repo/storage';
import { keys } from '@repo/storage/keys';

// GET - Retrieve a specific project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the user
    const user = await getOrCreateUserRecord();
    
    // Get the project
    const project = await db.project.findUnique({
      where: {
        id: params.id,
        userId: user.id
      },
      include: {
        chats: {
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
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or you do not have access' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(project);
  } catch (error) {
    console.error('[API] Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT - Update a project
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Check if the project exists and belongs to the user
    const project = await db.project.findUnique({
      where: {
        id: params.id,
        userId: user.id
      }
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or you do not have access' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: any = {
      name: body.name
    };
    
    // Add description if provided
    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    
    // Handle image data if provided
    if (body.imageBase64) {
      try {
        // Convert base64 to Buffer
        const imageBuffer = Buffer.from(body.imageBase64.split(',')[1], 'base64');
        
        // Generate a filename with UUID to avoid collisions
        const fileName = `project-${params.id}-${Date.now()}.png`;
        
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
        updateData.imageUrl = blob.url;
        console.log('[API] Image uploaded to Blob storage for project update');
      } catch (imageError) {
        console.error('[API] Error processing image data:', imageError);
        // Continue without updating image if there's an error
      }
    }
    
    // Update the project
    const updatedProject = await db.project.update({
      where: {
        id: params.id
      },
      data: updateData
    });
    
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('[API] Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the user
    const user = await getOrCreateUserRecord();
    
    // Check if the project exists and belongs to the user
    const project = await db.project.findUnique({
      where: {
        id: params.id,
        userId: user.id
      }
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or you do not have access' },
        { status: 404 }
      );
    }
    
    // Delete the project
    await db.project.delete({
      where: {
        id: params.id
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
} 