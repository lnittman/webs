"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Command } from "cmdk";
import { useAuth, useUser } from "@clerk/nextjs";
import { ArrowRight, ChatDots, MagnifyingGlass, SignIn, X, Plus } from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@repo/design/components/ui/button";
import { useChatStore, useChatNavigation, useChats } from "@/lib/store/chatStore";
import { formatDistanceToNow } from "date-fns";
import { useAtom } from "jotai";
import { commandMenuOpenAtom } from "@/lib/store/settingsStore";
import { cn } from "@/lib/utils";

// Add custom styles to fix placeholder color in dark mode
const customStyles = `
  .command-input-overlay::placeholder {
    color: var(--foreground);
    opacity: 0.6;
  }
`;

// Group chats by date - copied from Sidebar for consistency
const groupChatsByDate = (chats: any[] | undefined) => {
  // Handle undefined or empty chats array
  if (!chats || !Array.isArray(chats)) {
    // Return empty groups if chats is undefined
    return {
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Previous 30 Days': [],
      'Older': []
    };
  }

  // Filter chats to only include those with at least one message
  const chatsWithMessages = chats.filter(chat => chat.messages && chat.messages.length > 0);
  
  const groups: Record<string, any[]> = {
    'Today': [],
    'Yesterday': [],
    'Previous 7 Days': [],
    'Previous 30 Days': [],
    'Older': []
  };

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastMonth = new Date(now);
  lastMonth.setDate(lastMonth.getDate() - 30);

  chatsWithMessages.forEach(chat => {
    const chatDate = new Date(chat.updatedAt);
    
    if (chatDate.toDateString() === now.toDateString()) {
      groups['Today'].push(chat);
    } else if (chatDate.toDateString() === yesterday.toDateString()) {
      groups['Yesterday'].push(chat);
    } else if (chatDate > lastWeek) {
      groups['Previous 7 Days'].push(chat);
    } else if (chatDate > lastMonth) {
      groups['Previous 30 Days'].push(chat);
    } else {
      groups['Older'].push(chat);
    }
  });

  return groups;
};

export function CommandOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [open, setOpen] = useAtom(commandMenuOpenAtom);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get chats using the refactored hooks
  const { messages } = useChatStore(); // Just for UI state if needed
  const { chats, isLoading, isError, mutateChats } = useChats();
  
  // Group chats by date
  const chatGroups = groupChatsByDate(chats);

  // Filter chat groups based on search
  const filteredChatGroups = Object.fromEntries(
    Object.entries(chatGroups).map(([group, groupChats]) => [
      group, 
      groupChats.filter(chat => chat.title.toLowerCase().includes(search.toLowerCase()))
    ])
  );

  // Fetch chats when the menu opens and user is signed in
  useEffect(() => {
    if (open && isSignedIn) {
      mutateChats();
    }
  }, [open, isSignedIn, mutateChats]);

  // Focus the input when the menu opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Navigate to selected chat
  const handleSelectChat = (chatId: string) => {
    setOpen(false);
    router.push(`/c/${chatId}`);
  };

  if (!open) {
    return null;
  }

  return (
    <>
      {/* Include custom styles */}
      <style jsx global>{customStyles}</style>
      <div className="fixed inset-0 z-[200] bg-background flex flex-col h-screen">
        <Command className="h-full overflow-hidden flex flex-col" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
          {/* Header with search and close button */}
          <div className="flex items-center border-b p-3 sticky top-0 bg-background z-10">
            <MagnifyingGlass weight="duotone" className="h-5 w-5 shrink-0 text-muted-foreground mr-2" />
            <Command.Input 
              ref={inputRef}
              value={search}
              onValueChange={setSearch}
              placeholder="search chats..."
              className="command-input-overlay flex h-10 w-full bg-transparent py-2 text-base outline-none text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button 
              onClick={() => setOpen(false)}
              className="ml-2 h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent/50"
            >
              <X weight="duotone" className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          
          {/* New chat button - fixed position */}
          <div className="px-2 py-3 bg-background">
            <Link
              href="/new"
              className="flex items-center gap-2 w-full p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <div className="h-8 w-8 rounded-full bg-accent/40 flex items-center justify-center">
                <Plus weight="duotone" className="h-5 w-5 text-foreground" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground">new chat</div>
              </div>
            </Link>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto relative">
            {/* Top fade gradient - starts below the new chat button */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background to-transparent z-[1] pointer-events-none"></div>
            
            <Command.List className="h-full overflow-y-auto py-2 px-2 pb-10">
              {isSignedIn ? (
                <>
                  {/* Empty state */}
                  <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                    no chats found.
                  </Command.Empty>
                  
                  {/* Loading state */}
                  {isLoading ? (
                    <div className="py-6 text-center">
                      <p className="text-sm text-muted-foreground">loading your chats...</p>
                    </div>
                  ) : Object.entries(filteredChatGroups).some(([_, groupChats]) => groupChats.length > 0) ? (
                    Object.entries(filteredChatGroups).map(([group, groupChats]) => 
                      groupChats.length > 0 && (
                        <div key={group} className="mb-4">
                          <Command.Group heading={group} className="text-xs text-muted-foreground px-2 py-1">
                            {groupChats.map(chat => (
                              <Command.Item
                                key={chat.id}
                                onSelect={() => handleSelectChat(chat.id)}
                                className={cn(
                                  "px-3 py-2 rounded-md text-sm cursor-pointer",
                                  pathname.includes(`/c/${chat.id}`) ? "bg-accent/70" : "hover:bg-accent/50"
                                )}
                              >
                                <span className="truncate text-foreground">{chat.title}</span>
                              </Command.Item>
                            ))}
                          </Command.Group>
                        </div>
                      )
                    )
                  ) : (
                    <div className="py-6 text-center">
                      <p className="text-sm text-muted-foreground mb-2">you have no chats yet</p>
                      <Button 
                        onClick={() => {
                          setOpen(false);
                          router.push('/new');
                        }}
                        variant="outline" 
                        className="text-sm"
                      >
                        start a new chat
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="px-4 py-12 flex flex-col items-center justify-center h-full">
                  <div className="mb-6 flex items-center">
                    <span className="web-emoji mr-2">🕸️</span>
                    <span className="text-primary text-2xl mb-1">webs</span>
                  </div>
                  <p className="text-base text-muted-foreground mb-8">
                    sign in to view your chat history
                  </p>
                  <Button 
                    asChild 
                    className="w-full max-w-xs rounded-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center"
                  >
                    <Link href="/signin">
                      <SignIn weight="duotone" className="h-5 w-5 mr-2" />
                      <span>sign in</span>
                      <ArrowRight weight="bold" className="h-4 w-4 ml-auto arrow-icon" />
                    </Link>
                  </Button>
                </div>
              )}
            </Command.List>
            
            {/* Bottom fade gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
          </div>
        </Command>
      </div>
    </>
  );
} 