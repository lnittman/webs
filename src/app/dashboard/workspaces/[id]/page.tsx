import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, truncate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Settings, ArrowLeft, ExternalLink } from "lucide-react";

interface WorkspacePageProps {
  params: {
    id: string;
  };
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has access to this workspace
  const userWorkspace = await prisma.userWorkspace.findFirst({
    where: {
      workspaceId: params.id,
      userId: session.user.id,
    },
    include: {
      workspace: true,
    },
  });

  if (!userWorkspace) {
    redirect("/dashboard");
  }

  // Get workspace pages
  const pages = await prisma.page.findMany({
    where: {
      workspaceId: params.id,
    },
    orderBy: {
      fetchedAt: "desc",
    },
    include: {
      _count: {
        select: {
          chunks: true,
        },
      },
    },
  });

  // Get workspace members
  const members = await prisma.userWorkspace.findMany({
    where: {
      workspaceId: params.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
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
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">{userWorkspace.workspace.name}</h1>
              <p className="text-muted-foreground mt-1">
                {userWorkspace.workspace.description || "No description"}
              </p>
            </div>
            <div className="flex space-x-2">
              <Link href={`/dashboard/workspaces/${params.id}/fetch`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Content
                </Button>
              </Link>
              {(userWorkspace.role === "OWNER" || userWorkspace.role === "ADMIN") && (
                <Link href={`/dashboard/workspaces/${params.id}/settings`}>
                  <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Workspace stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Pages</h2>
            <p className="text-2xl font-bold">{pages.length}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Members</h2>
            <p className="text-2xl font-bold">{members.length}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Your Role</h2>
            <p className="text-2xl font-bold">{userWorkspace.role}</p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Content</h2>
            <div className="flex items-center space-x-2">
              <Link href={`/dashboard/workspaces/${params.id}/fetch`}>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Add Content
                </Button>
              </Link>
            </div>
          </div>
          {pages.length === 0 ? (
            <div className="border rounded-lg p-8 text-center">
              <h3 className="font-medium mb-2">No content yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first page to this workspace
              </p>
              <Link href={`/dashboard/workspaces/${params.id}/fetch`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Content
                </Button>
              </Link>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-medium">Title</th>
                      <th className="text-left p-3 font-medium">URL</th>
                      <th className="text-left p-3 font-medium">Chunks</th>
                      <th className="text-left p-3 font-medium">Fetched</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pages.map((page) => (
                      <tr key={page.id} className="hover:bg-muted/50">
                        <td className="p-3">
                          <div className="font-medium">{truncate(page.title, 40)}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-muted-foreground">
                            {truncate(page.url, 40)}
                          </div>
                        </td>
                        <td className="p-3">{page._count.chunks}</td>
                        <td className="p-3">
                          <div className="text-sm">{formatDate(page.fetchedAt)}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex space-x-2">
                            <Link href={`/dashboard/content/${page.id}`}>
                              <Button size="sm" variant="ghost">View</Button>
                            </Link>
                            <a href={page.url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="ghost">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Members */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Members</h2>
            {(userWorkspace.role === "OWNER" || userWorkspace.role === "ADMIN") && (
              <Link href={`/dashboard/workspaces/${params.id}/members`}>
                <Button size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" /> Invite Member
                </Button>
              </Link>
            )}
          </div>
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Email</th>
                    <th className="text-left p-3 font-medium">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {members.map((member) => (
                    <tr key={member.user.id} className="hover:bg-muted/50">
                      <td className="p-3">
                        <div className="font-medium">{member.user.name}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-muted-foreground">
                          {member.user.email}
                        </div>
                      </td>
                      <td className="p-3">{member.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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