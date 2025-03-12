import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, truncate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Search, MessageSquare, FileText } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Get user's workspaces
  const workspaces = await prisma.userWorkspace.findMany({
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

  // Get recent pages
  const recentPages = await prisma.page.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      fetchedAt: "desc",
    },
    take: 5,
    include: {
      workspace: true,
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
              <span className="font-bold text-xl">⚡ webs</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/dashboard" className="transition-colors hover:text-foreground/80">
                Dashboard
              </Link>
              <Link href="/dashboard/search" className="transition-colors hover:text-foreground/80">
                Search
              </Link>
              <Link href="/dashboard/chat" className="transition-colors hover:text-foreground/80">
                Chat
              </Link>
            </nav>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Link href="/dashboard/settings">
              <Button variant="ghost">Settings</Button>
            </Link>
            <Link href="/api/auth/signout">
              <Button variant="ghost">Sign out</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Link href="/dashboard/workspaces/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Workspace
            </Button>
          </Link>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/dashboard/fetch">
            <div className="border rounded-lg p-4 hover:bg-accent transition-colors">
              <h2 className="font-semibold mb-2">Fetch Content</h2>
              <p className="text-sm text-muted-foreground">
                Add new content from any URL to your workspaces
              </p>
            </div>
          </Link>
          <Link href="/dashboard/search">
            <div className="border rounded-lg p-4 hover:bg-accent transition-colors">
              <h2 className="font-semibold mb-2">Search Content</h2>
              <p className="text-sm text-muted-foreground">
                Find content across all your workspaces
              </p>
            </div>
          </Link>
          <Link href="/dashboard/chat">
            <div className="border rounded-lg p-4 hover:bg-accent transition-colors">
              <h2 className="font-semibold mb-2">Chat with Content</h2>
              <p className="text-sm text-muted-foreground">
                Ask questions about your indexed content
              </p>
            </div>
          </Link>
        </div>

        {/* Workspaces */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Workspaces</h2>
            <Link href="/dashboard/workspaces">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.length === 0 ? (
              <div className="col-span-full border rounded-lg p-8 text-center">
                <h3 className="font-medium mb-2">No workspaces yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first workspace to start organizing your content
                </p>
                <Link href="/dashboard/workspaces/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Create Workspace
                  </Button>
                </Link>
              </div>
            ) : (
              workspaces.map((userWorkspace) => (
                <Link
                  key={userWorkspace.workspace.id}
                  href={`/dashboard/workspaces/${userWorkspace.workspace.id}`}
                >
                  <div className="border rounded-lg p-4 hover:bg-accent transition-colors h-full">
                    <h3 className="font-medium mb-1">{userWorkspace.workspace.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {userWorkspace.workspace.description || "No description"}
                    </p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{userWorkspace.workspace._count.pages} pages</span>
                      <span>Role: {userWorkspace.role}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent content */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Content</h2>
            <Link href="/dashboard/content">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </div>
          {recentPages.length === 0 ? (
            <div className="border rounded-lg p-8 text-center">
              <h3 className="font-medium mb-2">No content yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Fetch your first web page to start building your knowledge base
              </p>
              <Link href="/dashboard/fetch">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Fetch Content
                </Button>
              </Link>
            </div>
          ) : (
            <div className="border rounded-lg divide-y">
              {recentPages.map((page) => (
                <Link key={page.id} href={`/dashboard/content/${page.id}`}>
                  <div className="p-4 hover:bg-accent transition-colors">
                    <h3 className="font-medium mb-1">{page.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {truncate(page.url, 60)}
                    </p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Workspace: {page.workspace.name}</span>
                      <span>Fetched: {formatDate(page.fetchedAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Webs. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 