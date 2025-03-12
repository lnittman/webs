"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "ai/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  ArrowLeft,
  Send,
  Bot,
  User,
  Loader2,
  Settings,
  Trash,
  Download,
  Copy
} from "lucide-react";
import { AI_MODELS } from "@/lib/ai";

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get workspace ID from URL if present
  const workspaceId = searchParams.get("workspace");
  const domain = searchParams.get("domain");
  
  // State for model selection
  const [selectedModel, setSelectedModel] = useState("google/gemini-2-flash-001");
  
  // Initialize chat with Vercel AI SDK
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, append } = useChat({
    api: "/api/chat",
    body: {
      workspaceId,
      domain,
      modelId: selectedModel
    },
    onError: (err) => {
      console.error("Chat error:", err);
    }
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle model change
  const handleModelChange = (value: string) => {
    setSelectedModel(value);
  };

  // Copy message to clipboard
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
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
              <Link href="/dashboard/chat" className="transition-colors hover:text-foreground/80 text-foreground">
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
      <main className="flex-1 container py-6 flex flex-col">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Chat with Your Content</h1>
              <p className="text-muted-foreground mt-1">
                Ask questions about your indexed web content
                {domain && <span> from <strong>{domain}</strong></span>}
                {workspaceId && <span> in this workspace</span>}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedModel} onValueChange={handleModelChange}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google/gemini-2-flash-001">Gemini 2 Flash</SelectItem>
                  <SelectItem value="anthropic/claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                  <SelectItem value="anthropic/claude-3-7-sonnet">Claude 3.7 Sonnet</SelectItem>
                  <SelectItem value="openai/gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="mistralai/mistral-large">Mistral Large</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" title="Chat settings">
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                title="Clear chat"
                onClick={() => router.refresh()}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto border rounded-lg mb-4 p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Bot className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-medium mb-2">Start a conversation</h2>
              <p className="text-muted-foreground max-w-md">
                Ask questions about your indexed content. The AI will search through your pages to find relevant information.
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-md">
                <Button 
                  variant="outline" 
                  className="justify-start text-left"
                  onClick={() => append({
                    role: "user",
                    content: "What are the main topics in my content?"
                  })}
                >
                  What are the main topics in my content?
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start text-left"
                  onClick={() => append({
                    role: "user",
                    content: "Summarize the key points from my recent pages"
                  })}
                >
                  Summarize the key points from my recent pages
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start text-left"
                  onClick={() => append({
                    role: "user",
                    content: "Find information about [specific topic]"
                  })}
                >
                  Find information about [specific topic]
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start text-left"
                  onClick={() => append({
                    role: "user",
                    content: "Compare what different sources say about [topic]"
                  })}
                >
                  Compare what different sources say about [topic]
                </Button>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`
                    flex max-w-[80%] md:max-w-[70%] rounded-lg p-4
                    ${message.role === "user" 
                      ? "bg-primary text-primary-foreground ml-4" 
                      : "bg-muted mr-4"
                    }
                  `}
                >
                  <div className="mr-3 flex-shrink-0 pt-1">
                    {message.role === "user" ? (
                      <User className="h-5 w-5" />
                    ) : (
                      <Bot className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="prose dark:prose-invert">
                      {message.content}
                    </div>
                    {message.role === "assistant" && (
                      <div className="flex justify-end mt-2 space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => copyMessage(message.content)}
                          title="Copy to clipboard"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Ask a question about your content..."
              className="min-h-[80px] resize-none pr-12"
              rows={3}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute bottom-3 right-3" 
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>

        {/* Error message */}
        {error && (
          <div className="mt-2 text-sm text-destructive">
            Error: {error.message || "Something went wrong. Please try again."}
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