"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useAuth, useUser } from "@clerk/nextjs";
import { ArrowRight, ChatDots, MagnifyingGlass, SignIn } from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@repo/design/components/ui/button";
import { useChatHistoryStore } from "@/lib/store/chatHistoryStore";
import { formatDistanceToNow } from "date-fns";
import { useAtom } from "jotai";
import { commandMenuOpenAtom } from "@/lib/store/settingsStore";

export function CommandMenu() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [open, setOpen] = useAtom(commandMenuOpenAtom);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Get chats from store
  const { chats, fetchChats, isLoading, setCurrentChat } = useChatHistoryStore();

  // Filter chat history based on search
  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(search.toLowerCase())
  );

  // Fetch chats when the menu opens and user is signed in
  useEffect(() => {
    if (open && isSignedIn) {
      fetchChats();
    }
  }, [open, isSignedIn, fetchChats]);

  // Focus the input when the menu opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prevIndex => {
        const max = filteredChats.length - 1;
        if (e.key === "ArrowDown") {
          return prevIndex < max ? prevIndex + 1 : 0;
        } else {
          return prevIndex > 0 ? prevIndex - 1 : max;
        }
      });
    }
  };

  // Navigate to selected chat
  const handleSelectChat = (chatId: string) => {
    setCurrentChat(chatId);
    setOpen(false);
    router.push(`/chat/${chatId}`);
  };

  if (!open) {
    return null;
  }

  // Handle closing when backdrop is clicked
  const handleBackdropClick = () => {
    setOpen(false);
  };

  // Format the date for display
  const formatDate = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 bg-background/90 backdrop-blur-sm" 
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Command dialog */}
      <div className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform">
        <Command className="rounded-lg bg-background shadow-md overflow-hidden " onKeyDown={handleKeyDown}>
          {isSignedIn && (
            <div className="flex items-center border-b px-3">
              <MagnifyingGlass weight="bold" className="h-4 w-4 shrink-0 text-muted-foreground mr-2" />
              <Command.Input 
                ref={inputRef}
                value={search}
                onValueChange={setSearch}
                placeholder="Search chat history..."
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          )}
          
          <Command.List className="max-h-[300px] overflow-y-auto py-2">
            {isSignedIn ? (
              <>
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                  No chats found.
                </Command.Empty>
                
                {isLoading ? (
                  <div className="py-6 text-center">
                    <p className="text-sm text-muted-foreground">Loading your chats...</p>
                  </div>
                ) : filteredChats.length > 0 ? (
                  <Command.Group heading="Recent Chats">
                    {filteredChats.map((chat, index) => (
                      <Command.Item
                        key={chat.id}
                        onSelect={() => handleSelectChat(chat.id)}
                        className={`mx-2 px-2 py-2 rounded-md text-sm cursor-pointer flex items-center justify-between 
                          ${selectedIndex === index ? 'bg-muted/60' : 'hover:bg-muted/40'}`}
                      >
                        <div className="flex items-center gap-2">
                          <ChatDots weight="bold" className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[280px]">{chat.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(chat.updatedAt)}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">You have no chats yet</p>
                    <Button 
                      onClick={() => {
                        setOpen(false);
                        router.push('/');
                      }}
                      variant="outline" 
                      className="text-xs"
                    >
                      Start a new chat
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="px-4 py-6 text-center border border-primary/10 rounded-2xl">
                <div className="mb-4 flex justify-center items-center mt-8">
                  <span className="web-emoji mr-2">🕸️</span>
                  <span className="text-primary text-2xl mb-1">webs</span>
                </div>
                <p className="text-sm text-muted-foreground mb-12">
                  sign in to view history
                </p>
                <Button 
                  asChild 
                  className="w-full rounded-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 hover:transition-colors hover:duration-200 flex items-center justify-center"
                >
                  <Link href="/signin">
                    <SignIn weight="duotone" className="h-4 w-4 mr-2" />
                    <span>sign in</span>
                    <ArrowRight weight="bold" className="h-4 w-4 ml-auto arrow-icon" />
                  </Link>
                </Button>
              </div>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
} 