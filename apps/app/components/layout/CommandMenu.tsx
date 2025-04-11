"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Command } from "cmdk";
import { useAuth, useUser } from "@clerk/nextjs";
import { ArrowRight, Plus, MagnifyingGlass, SignIn, X, ChatDots } from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@repo/design/components/ui/button";
import { useChatStore, useChatNavigation, useChats } from "@/lib/store/chatStore";
import { useAtom } from "jotai";
import { commandMenuOpenAtom } from "@/lib/store/settingsStore";
import { useMediaQuery } from "@repo/design/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

// Add custom styles to fix placeholder color in dark mode
const customStyles = `
  .command-input::placeholder {
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

export function CommandMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [open, setOpen] = useAtom(commandMenuOpenAtom);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [selectedItem, setSelectedItem] = useState("new-chat");
  
  // Get chats from the refactored hooks
  const { messages } = useChatStore(); // Only for UI state if needed
  const { chats, isLoading, mutateChats } = useChats();

  // Group chats by date
  const chatGroups = groupChatsByDate(chats);

  // Filter chat groups based on search
  const filteredChatGroups = Object.fromEntries(
    Object.entries(chatGroups).map(([group, groupChats]) => [
      group, 
      groupChats.filter(chat => chat.title.toLowerCase().includes(search.toLowerCase()))
    ])
  );

  // Reset selection when search changes or menu opens
  useEffect(() => {
    if (open) {
      setSelectedItem("new-chat");
      
      // Force focus on the command input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [open, search]);

  // Focus the input when the menu opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (open) {
          setOpen(false);
        } else {
          setOpen(true);
        }
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  // Navigate to selected chat
  const handleSelectChat = (chatId: string) => {
    setOpen(false);
    router.push(`/c/${chatId}`);
  };

  // Handle creating a new chat
  const handleNewChat = () => {
    setOpen(false);
    router.push('/new');
  };

  // Only render if on desktop
  if (!isDesktop) {
    return null;
  }

  // Handle closing when backdrop is clicked
  const handleBackdropClick = () => {
    setOpen(false);
  };

  // Function to generate a flat list of all chats for keyboard navigation
  const getAllItems = () => {
    const items: { id: string, type: 'new-chat' | 'chat', chatId?: string }[] = [
      { id: 'new-chat', type: 'new-chat' }
    ];
    
    Object.entries(filteredChatGroups).forEach(([group, groupChats]) => {
      if (groupChats.length > 0) {
        groupChats.forEach(chat => {
          items.push({ id: chat.id, type: 'chat', chatId: chat.id });
        });
      }
    });
    
    return items;
  };

  // Get all navigable items
  const allItems = getAllItems();

  // Handle custom keyboard navigation
  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    // Prevent default for arrow up/down to avoid scroll behavior
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      
      const currentIndex = allItems.findIndex(item => item.id === selectedItem);
      let nextIndex;
      
      if (e.key === "ArrowDown") {
        // Move down the list
        nextIndex = currentIndex < allItems.length - 1 ? currentIndex + 1 : currentIndex;
      } else {
        // Move up the list, but don't wrap to bottom
        nextIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
      }
      
      setSelectedItem(allItems[nextIndex].id);
    } else if (e.key === "Enter") {
      const selectedItemData = allItems.find(item => item.id === selectedItem);
      
      if (selectedItemData) {
        if (selectedItemData.type === 'new-chat') {
          handleNewChat();
        } else if (selectedItemData.type === 'chat' && selectedItemData.chatId) {
          handleSelectChat(selectedItemData.chatId);
        }
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <>
      {/* Include custom styles */}
      <style jsx global>{customStyles}</style>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100]">
            {/* Backdrop with blur */}
            <motion.div 
              className="fixed inset-0 bg-background/60 backdrop-blur-md" 
              onClick={handleBackdropClick}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            
            {/* Command dialog */}
            <motion.div 
              className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Command 
                className="rounded-lg bg-background shadow-lg overflow-hidden border border-border/50 flex flex-col"
                onKeyDown={handleKeyNavigation}
                loop={false}
              >
                {/* Search header */}
                <div className="flex items-center border-b px-3 py-2 relative">
                  <div className="flex items-center justify-center w-6">
                    <MagnifyingGlass weight="duotone" className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <Command.Input 
                    ref={inputRef}
                    value={search}
                    onValueChange={setSearch}
                    placeholder="search chats..."
                    className="command-input flex h-9 w-full rounded-md bg-transparent py-2 text-sm outline-none text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <button 
                    onClick={() => setOpen(false)}
                    className="absolute right-3 h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent/50 transition-colors"
                  >
                    <X weight="duotone" className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                
                {/* New chat button - fixed position */}
                <div className="px-2 py-2 bg-background">
                  <Command.Item
                    value="new-chat"
                    onSelect={handleNewChat}
                    className={cn(
                      "flex items-center gap-2 w-full p-2 rounded-md transition-colors",
                      selectedItem === "new-chat" ? "bg-accent/70" : "bg-accent/30 hover:bg-accent/50"
                    )}
                  >
                    <div className="h-6 w-6 rounded-full bg-accent/40 flex items-center justify-center">
                      <Plus weight="duotone" className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">new chat</div>
                    </div>
                  </Command.Item>
                </div>
                
                {/* Content area with gradients */}
                <div className="relative flex-1 overflow-hidden max-h-[300px]">
                  {/* Top fade gradient - only inside the scrollable area */}
                  <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-background to-transparent z-[1] pointer-events-none"></div>
                  
                  <Command.List className="overflow-y-auto py-2 px-2 pb-8 h-full">
                    {isSignedIn ? (
                      <>
                        {/* Empty state */}
                        <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                          no chats found.
                        </Command.Empty>
                        
                        {/* Chat list */}
                        {!chats || chats.length === 0 ? (
                          <div className="py-6 text-center">
                            <p className="text-sm text-muted-foreground mb-2">you have no chats yet</p>
                            <Button 
                              onClick={() => {
                                setOpen(false);
                                router.push('/new');
                              }}
                              variant="outline" 
                              className="text-xs"
                            >
                              start a new chat
                            </Button>
                          </div>
                        ) : Object.entries(filteredChatGroups).some(([_, groupChats]) => groupChats.length > 0) ? (
                          Object.entries(filteredChatGroups).map(([group, groupChats]) => 
                            groupChats.length > 0 && (
                              <div key={group} className="mb-2">
                                <Command.Group heading={group} className="px-2 py-1 text-xs text-muted-foreground">
                                  {groupChats.map(chat => (
                                    <div
                                      key={chat.id}
                                      onMouseEnter={() => setSelectedItem(chat.id)}
                                      onClick={() => handleSelectChat(chat.id)}
                                      className={cn(
                                        "px-2 py-1.5 rounded-md cursor-pointer flex items-center",
                                        selectedItem === chat.id ? "bg-accent" : "hover:bg-accent/50",
                                        pathname.includes(`/c/${chat.id}`) ? "font-medium" : ""
                                      )}
                                    >
                                      <ChatDots weight="duotone" className="h-4 w-4 mr-2 text-muted-foreground" />
                                      <span className="flex-1 truncate text-sm">{chat.title}</span>
                                    </div>
                                  ))}
                                </Command.Group>
                              </div>
                            )
                          )
                        ) : null}
                      </>
                    ) : (
                      <div className="px-4 py-6 text-center border border-primary/10 rounded-2xl mx-2">
                        <div className="mb-4 flex justify-center items-center mt-8">
                          <span className="web-emoji mr-2">🕸️</span>
                          <span className="text-primary text-2xl mb-1">webs</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-10">
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
                  
                  {/* Bottom fade gradient */}
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
                </div>
              </Command>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
} 