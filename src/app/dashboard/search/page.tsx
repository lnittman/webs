"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Search as SearchIcon,
  ExternalLink,
  MessageSquare,
  Loader2,
  FileText,
} from "lucide-react";
import { formatDate, truncate } from "@/lib/utils";

interface SearchResult {
  id: string;
  url: string;
  title: string;
  fetchedAt: string;
  workspace: {
    id: string;
    name: string;
  };
  summary?: string;
  similarity: number;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get query from URL if present
  const initialQuery = searchParams.get("q") || "";
  const initialWorkspace = searchParams.get("workspace") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [selectedWorkspace, setSelectedWorkspace] = useState(initialWorkspace);
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string }[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch workspaces on mount
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await fetch("/api/workspaces");
        if (!response.ok) throw new Error("Failed to fetch workspaces");
        
        const data = await response.json();
        setWorkspaces(data.workspaces);
      } catch (err) {
        console.error("Error fetching workspaces:", err);
        setError("Failed to load workspaces");
      }
    };
    
    fetchWorkspaces();
  }, []);

  // Perform search when query changes or on initial load with query
  useEffect(() => {
    if (initialQuery) {
      handleSearch();
    }
  }, [initialQuery, initialWorkspace]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Update URL with search parameters
      const params = new URLSearchParams();
      params.set("q", query);
      if (selectedWorkspace) params.set("workspace", selectedWorkspace);
      router.push(`/dashboard/search?${params.toString()}`);
      
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          workspaceId: selectedWorkspace || undefined,
          limit: 20,
        }),
      });
      
      if (!response.ok) throw new Error("Search failed");
      
      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      console.error("Search error:", err);
      setError("An error occurred while searching. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
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
              <Link href="/dashboard/search" className="transition-colors hover:text-foreground/80 text-foreground">
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
          <h1 className="text-3xl font-bold">Search Content</h1>
          <p className="text-muted-foreground mt-1">
            Search across your indexed web content using semantic search
          </p>
        </div>

        {/* Search form */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search your content..."
              className="pr-10"
            />
            {isLoading ? (
              <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <SearchIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="All workspaces" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All workspaces</SelectItem>
              {workspaces.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} disabled={isLoading || !query.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <SearchIcon className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </div>

        {/* Search results */}
        {error ? (
          <div className="rounded-lg border border-destructive p-4 text-destructive">
            {error}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">
              {results.length} {results.length === 1 ? "result" : "results"} found
            </h2>
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{result.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {truncate(result.url, 80)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/dashboard/content/${result.id}`}>
                        <Button size="sm" variant="ghost" title="View content">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/dashboard/chat?content=${result.id}`}>
                        <Button size="sm" variant="ghost" title="Chat about this content">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </Link>
                      <a href={result.url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" title="Open original URL">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                  {result.summary && (
                    <p className="text-sm mt-2 line-clamp-3">{result.summary}</p>
                  )}
                  <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                    <span>Workspace: {result.workspace.name}</span>
                    <span>Fetched: {formatDate(result.fetchedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : initialQuery ? (
          <div className="text-center py-12">
            <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-medium mb-2">No results found</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              We couldn't find any content matching your search. Try using different keywords or fetch more content.
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-medium mb-2">Search your content</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Enter a search query above to find relevant content across your indexed pages.
            </p>
          </div>
        )}
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