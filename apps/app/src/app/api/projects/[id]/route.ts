import { NextRequest, NextResponse } from 'next/server';
import { database as db } from '@repo/database';
import { getOrCreateUserRecord } from '@/src/lib/utils/auth';

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
    
    // Update the project
    const updatedProject = await db.project.update({
      where: {
        id: params.id
      },
      data: {
        name: body.name
      }
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