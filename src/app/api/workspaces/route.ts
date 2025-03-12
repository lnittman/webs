import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "edge";

// Schema for workspace creation
const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(100),
  description: z.string().max(500).optional(),
});

// GET /api/workspaces - Get all workspaces for the current user
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all workspaces the user has access to
    const userWorkspaces = await prisma.userWorkspace.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        workspace: {
          include: {
            _count: {
              select: {
                pages: true,
              },
            },
          },
        },
      },
      orderBy: {
        workspace: {
          updatedAt: "desc",
        },
      },
    });

    // Format the response
    const workspaces = userWorkspaces.map((uw) => ({
      id: uw.workspace.id,
      name: uw.workspace.name,
      description: uw.workspace.description,
      role: uw.role,
      pageCount: uw.workspace._count.pages,
      createdAt: uw.workspace.createdAt,
      updatedAt: uw.workspace.updatedAt,
    }));

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error("Error in GET /api/workspaces:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/workspaces - Create a new workspace
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const result = createWorkspaceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.format() },
        { status: 400 }
      );
    }

    const { name, description } = result.data;

    // Create the workspace and add the user as owner
    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
    });

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/workspaces:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 