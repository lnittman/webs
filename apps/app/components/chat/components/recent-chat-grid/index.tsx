"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useChats, useChatNavigation } from '@/lib/store/chatStore';
import { formatDistanceToNow } from "date-fns";
import { ChatDots, CaretDown } from "@phosphor-icons/react";
import { useMediaQuery } from "@repo/design/hooks/use-media-query";
import { cn } from "@/lib/utils";

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent
} from "@repo/design/components/ui/collapsible";
import { Button } from "@repo/design/components/ui/button";
import { useRouter } from "next/navigation";

export function RecentChatsGrid() {
  const { chats, isLoading, mutateChats } = useChats();
  const { navigateToChat } = useChatNavigation();
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isOpen, setIsOpen] = useState(true);
  
  // Fetch chats on component mount
  useEffect(() => {
    mutateChats();
  }, [mutateChats]);
  
  // Navigate to a chat
  const handleChatSelect = (chatId: string) => {
    navigateToChat(chatId);
  };
  
  // Format time for display
  const formatTime = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };
  
  if (!chats || chats.length === 0) {
    return null; // Don't show section if no chats
  }
  
  return (
    <Collapsible 
      defaultOpen 
      open={isOpen} 
      onOpenChange={setIsOpen}
      className="w-full max-w-3xl mx-auto px-2 mt-4"
    >
      <div className="flex items-center justify-between mb-2 group cursor-pointer">
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-foreground hover:text-primary hover:bg-transparent px-0 flex-1 flex justify-between"
          >
            <h3 className="text-sm font-medium flex items-center">
              <span>recent</span>
              <span className="text-xs text-muted-foreground ml-2">({chats.length})</span>
            </h3>
            <CaretDown 
              weight="duotone" 
              className={cn(
                "h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform duration-200",
                isOpen ? "rotate-180" : "rotate-0"
              )} 
            />
          </Button>
        </CollapsibleTrigger>
        <Link href="/chats" className="text-xs text-primary hover:underline px-2">
          View all
        </Link>
      </div>
      
      <CollapsibleContent>
        {isLoading ? (
          <div className="h-16 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading recent chats...</p>
          </div>
        ) : (
          <div className={`grid ${isDesktop ? 'grid-cols-3' : 'grid-cols-1'} gap-3 mt-2`}>
            {chats.slice(0, isDesktop ? 6 : 3).map((chat) => (
              <div 
                key={chat.id}
                onClick={() => handleChatSelect(chat.id)}
                className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <ChatDots weight="duotone" className="h-4 w-4 text-primary" />
                  <h4 className="text-sm text-foreground font-medium truncate">{chat.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{formatTime(chat.updatedAt)}</p>
              </div>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
} 