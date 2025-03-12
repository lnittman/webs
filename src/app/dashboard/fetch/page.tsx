"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Globe,
  Loader2,
  Plus,
  Check,
  AlertCircle,
  Link as LinkIcon,
} from "lucide-react";

interface Workspace {
  id: string;
  name: string;
}

interface FetchStatus {
  status: "idle" | "fetching" | "success" | "error";
  message?: string;
  url?: string;
  title?: string;
  pageId?: string;
}

export default function FetchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get workspace ID from URL if present
  const initialWorkspaceId = searchParams.get("workspace") || "";
  
  const [url, setUrl] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState(initialWorkspaceId);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [depth, setDepth] = useState(0);
  const [maxPages, setMaxPages] = useState(10);
  const [generateSummary, setGenerateSummary] = useState(true);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>({ status: "idle" });
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState("");

  // Fetch workspaces on mount
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await fetch("/api/workspaces");
        if (!response.ok) throw new Error("Failed to fetch workspaces");
        
        const data = await response.json();
        setWorkspaces(data.workspaces);
        
        // If we have a workspace ID from URL and it exists, select it
        if (initialWorkspaceId && data.workspaces.some((w: Workspace) => w.id === initialWorkspaceId)) {
          setSelectedWorkspace(initialWorkspaceId);
        } else if (data.workspaces.length > 0) {
          // Otherwise select the first workspace
          setSelectedWorkspace(data.workspaces[0].id);
        }
      } catch (err) {
        console.error("Error fetching workspaces:", err);
      }
    };
    
    fetchWorkspaces();
  }, [initialWorkspaceId]);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    
    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newWorkspaceName,
          description: newWorkspaceDescription,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to create workspace");
      
      const data = await response.json();
      
      // Add the new workspace to the list and select it
      setWorkspaces([...workspaces, data.workspace]);
      setSelectedWorkspace(data.workspace.id);
      
      // Reset the form
      setNewWorkspaceName("");
      setNewWorkspaceDescription("");
      setIsCreatingWorkspace(false);
    } catch (err) {
      console.error("Error creating workspace:", err);
    }
  };

  const handleFetch = async () => {
    if (!url.trim() || !selectedWorkspace) return;
    
    setFetchStatus({ status: "fetching" });
    
    try {
      const response = await fetch("/api/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          workspaceId: selectedWorkspace,
          depth,
          maxPages,
          generateSummaryFlag: generateSummary,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch content");
      }
      
      const data = await response.json();
      
      setFetchStatus({
        status: "success",
        message: "Content fetched successfully!",
        url: data.url,
        title: data.title,
        pageId: data.pageId,
      });
    } catch (err) {
      console.error("Fetch error:", err);
      setFetchStatus({
        status: "error",
        message: err instanceof Error ? err.message : "An error occurred while fetching content",
      });
    }
  };

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
          <h1 className="text-3xl font-bold">Fetch Content</h1>
          <p className="text-muted-foreground mt-1">
            Add new web content to your workspaces
          </p>
        </div>

        {/* Fetch form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* URL input */}
            <div className="space-y-2">
              <Label htmlFor="url">URL to fetch</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="pl-10"
                  />
                </div>
                <Button 
                  onClick={handleFetch} 
                  disabled={fetchStatus.status === "fetching" || !url.trim() || !selectedWorkspace}
                >
                  {fetchStatus.status === "fetching" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    "Fetch"
                  )}
                </Button>
              </div>
            </div>

            {/* Workspace selection */}
            <div className="space-y-2">
              <Label>Workspace</Label>
              {isCreatingWorkspace ? (
                <div className="space-y-4 border rounded-lg p-4">
                  <div className="space-y-2">
                    <Label htmlFor="workspace-name">Workspace name</Label>
                    <Input
                      id="workspace-name"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      placeholder="My Workspace"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workspace-description">Description (optional)</Label>
                    <Textarea
                      id="workspace-description"
                      value={newWorkspaceDescription}
                      onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                      placeholder="What this workspace is about..."
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreatingWorkspace(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateWorkspace}
                      disabled={!newWorkspaceName.trim()}
                    >
                      Create Workspace
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select 
                    value={selectedWorkspace} 
                    onValueChange={setSelectedWorkspace}
                    disabled={workspaces.length === 0}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a workspace" />
                    </SelectTrigger>
                    <SelectContent>
                      {workspaces.map((workspace) => (
                        <SelectItem key={workspace.id} value={workspace.id}>
                          {workspace.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreatingWorkspace(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Workspace
                  </Button>
                </div>
              )}
            </div>

            {/* Advanced options */}
            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="font-medium">Advanced Options</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="depth">Link following depth</Label>
                  <Select value={depth.toString()} onValueChange={(value) => setDepth(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 - Just the URL</SelectItem>
                      <SelectItem value="1">1 - URL and direct links</SelectItem>
                      <SelectItem value="2">2 - URL, links, and their links</SelectItem>
                      <SelectItem value="3">3 - Three levels deep</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    How many levels of links to follow from the original URL
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-pages">Maximum pages</Label>
                  <Select value={maxPages.toString()} onValueChange={(value) => setMaxPages(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 page</SelectItem>
                      <SelectItem value="5">5 pages</SelectItem>
                      <SelectItem value="10">10 pages</SelectItem>
                      <SelectItem value="25">25 pages</SelectItem>
                      <SelectItem value="50">50 pages</SelectItem>
                      <SelectItem value="100">100 pages</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Limit the total number of pages to fetch
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="generate-summary" 
                  checked={generateSummary}
                  onCheckedChange={(checked) => setGenerateSummary(checked as boolean)}
                />
                <Label htmlFor="generate-summary">Generate AI summary</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Create an AI-generated summary of the content (uses API credits)
              </p>
            </div>

            {/* Status message */}
            {fetchStatus.status === "success" && (
              <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 p-4">
                <div className="flex">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-green-800 dark:text-green-300">
                      {fetchStatus.message}
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                      Successfully fetched: {fetchStatus.title}
                    </p>
                    <div className="mt-3">
                      <Link href={`/dashboard/content/${fetchStatus.pageId}`}>
                        <Button size="sm" variant="outline">
                          <LinkIcon className="mr-2 h-4 w-4" />
                          View Content
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {fetchStatus.status === "error" && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-red-800 dark:text-red-300">
                      Error fetching content
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                      {fetchStatus.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tips sidebar */}
          <div className="border rounded-lg p-4 h-fit">
            <h3 className="font-medium mb-2">Tips for fetching content</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Start with a specific URL rather than a homepage for better results</li>
              <li>• Use depth 0 for single pages, or higher for following links</li>
              <li>• Higher depth values will fetch more content but take longer</li>
              <li>• Set a reasonable maximum page limit to avoid excessive fetching</li>
              <li>• Content is automatically deduplicated if you fetch the same URL twice</li>
              <li>• AI summaries help you quickly understand the content</li>
            </ul>
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