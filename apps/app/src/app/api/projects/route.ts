import { NextRequest, NextResponse } from 'next/server';
import { database as db } from '@repo/database';
import { getOrCreateUserRecord } from '@/src/lib/utils/auth';

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
    
    // Create a new project
    const newProject = await db.project.create({
      data: {
        name: body.name,
        user: {
          connect: {
            id: user.id
          }
        }
      }
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