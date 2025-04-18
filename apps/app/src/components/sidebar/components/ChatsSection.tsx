"use client";

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@repo/design/hooks/use-media-query';
import { cn } from '@/src/lib/utils';
import { useSidebar } from '../SidebarProvider';
import { useChats, useChatNavigation } from '@/src/store/data/chat';
import { ChatItemMenu } from '../../shared/ChatItemMenu';

// Group chats by date
const groupChatsByDate = (chats: any[] | undefined) => {
  // Handle undefined or empty chats array
  if (!chats || !Array.isArray(chats)) {
    // Return empty groups if chats is undefined
    return {
      'today': [],
      'yesterday': [],
      'previous 7 days': [],
      'previous 30 days': [],
      'older': []
    };
  }

  // Filter chats to only include those with at least one message
  const chatsWithMessages = chats.filter(chat => chat.messages && chat.messages.length > 0);
  
  const groups: Record<string, any[]> = {
    'today': [],
    'yesterday': [],
    'previous 7 days': [],
    'previous 30 days': [],
    'older': []
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
      groups['today'].push(chat);
    } else if (chatDate.toDateString() === yesterday.toDateString()) {
      groups['yesterday'].push(chat);
    } else if (chatDate > lastWeek) {
      groups['previous 7 days'].push(chat);
    } else if (chatDate > lastMonth) {
      groups['previous 30 days'].push(chat);
    } else {
      groups['older'].push(chat);
    }
  });

  return groups;
};

export function ChatsSection() {
  const { isOpen, toggle } = useSidebar();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const pathname = usePathname();
  
  // Get chat data and navigation
  const { chats } = useChats();
  const { navigateToChat } = useChatNavigation();
  
  // Group chats by date for rendering
  const chatGroups = groupChatsByDate(chats);
  
  return (
    <>
      {/* Chats Section - No title header */}
      {Object.entries(chatGroups).some(([_, groupChats]) => groupChats.length > 0) ? (
        Object.entries(chatGroups).map(([group, groupChats]) => 
          groupChats.length > 0 && (
            <div key={group} className="mb-3">
              <div className="py-1 text-xs text-muted-foreground">
                {group}
              </div>
              <div className="space-y-1.5">
                <AnimatePresence mode="popLayout">
                  {groupChats.map(chat => (
                    <motion.div 
                      key={chat.id} 
                      className="group relative"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ 
                        opacity: 0, 
                        height: 0,
                        marginTop: 0,
                        marginBottom: 0,
                        transition: { 
                          opacity: { duration: 0.2 },
                          height: { duration: 0.3, delay: 0.1 }
                        }
                      }}
                      transition={{
                        opacity: { duration: 0.3 },
                        height: { duration: 0.3 }
                      }}
                      layout
                    >
                      <div
                        className={cn(
                          "flex items-center py-2 px-2 w-full min-h-[36px] hover:bg-accent/50 transition-colors rounded-md cursor-pointer",
                          pathname.includes(`/c/${chat.id}`) ? "bg-accent/70" : ""
                        )}
                        onClick={() => {
                          navigateToChat(chat.id);
                          if (!isDesktop) toggle();
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            navigateToChat(chat.id);
                            if (!isDesktop) toggle();
                          }
                        }}
                      >
                        <span className="text-sm truncate text-foreground flex-1 leading-normal">
                          {chat.title}
                        </span>
                        <span className="relative z-10">
                          <ChatItemMenu chatId={chat.id} />
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )
        )
      ) : (
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground">No chats yet</p>
          <p className="text-xs text-muted-foreground mt-1">Start a new conversation</p>
        </div>
      )}
    </>
  );
} 