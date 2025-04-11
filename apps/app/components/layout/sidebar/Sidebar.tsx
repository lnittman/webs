"use client";

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from './SidebarProvider';
import { useMediaQuery } from '@repo/design/hooks/use-media-query';
import { UserMenu } from './components/UserMenu';
import { useChatStore, useChatNavigation, useChats } from '@/lib/store/chatStore';
import { useProjectStore, useProjects, useProjectNavigation } from '@/lib/store/projectStore';
import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { commandMenuOpenAtom } from '@/lib/store/settingsStore';
import { CommandMenu } from '../CommandMenu';
import { CommandOverlay } from '../CommandOverlay';
import { ProjectModal } from '../modal/ProjectModal';
import { ChatItemMenu } from '../ChatItemMenu';
import { useRouter } from 'next/navigation';

import {
  Plus,
  CaretLeft,
  CaretRight,
  Sidebar as SidebarIcon,
  MagnifyingGlass,
  FolderSimple
} from '@phosphor-icons/react';

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

export function Sidebar() {
  const { isOpen, toggle, setIsOpen } = useSidebar();
  const pathname = usePathname();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [commandMenuOpen, setCommandMenuOpen] = useAtom(commandMenuOpenAtom);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const router = useRouter();
  
  // Track if initial load is complete to prevent animations on first render
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Get chats from SWR - use refactored hooks
  const { messages } = useChatStore(); // Just in case we need UI state
  const { chats, isLoading: isChatsLoading, isError, mutateChats } = useChats();
  
  // Get navigation functions
  const { navigateToChat } = useChatNavigation();
  
  // Get projects from store and SWR
  const { currentProjectId, setCurrentProject } = useProjectStore();
  const { data: projects, isLoading: isProjectsLoading } = useProjects();
  const { navigateToProject } = useProjectNavigation();
  
  // Fetch chats and projects on mount
  useEffect(() => {
    mutateChats();
  }, [mutateChats]);
  
  // Listen for keyboard shortcut to open command menu
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setCommandMenuOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCommandMenuOpen]);
  
  // Persist sidebar state for desktop and ensure mobile starts closed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // On initial load
      if (isDesktop) {
        // For desktop: retrieve from localStorage or default to open
        const savedState = localStorage.getItem('sidebarOpen');
        if (savedState !== null) {
          setIsOpen(savedState === 'true');
        }
      } else {
        // For mobile: always start closed
        setIsOpen(false);
      }
      
      // Mark initial load as complete after a short delay to ensure state is applied
      const timer = setTimeout(() => {
        setInitialLoadComplete(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isDesktop, setIsOpen]);
  
  // Save sidebar state to localStorage when it changes (desktop only)
  useEffect(() => {
    if (initialLoadComplete && isDesktop && typeof window !== 'undefined') {
      localStorage.setItem('sidebarOpen', isOpen.toString());
    }
  }, [isOpen, isDesktop, initialLoadComplete]);
  
  // Group chats by date for rendering
  const chatGroups = groupChatsByDate(chats);
  
  // Use API projects if available, or fall back to store projects
  const projectsList = projects || [];
  const isLoading = isChatsLoading || isProjectsLoading || isError;

  return (
    <>
      {/* Mobile overlay when sidebar is open */}
      <AnimatePresence>
        {isOpen && !isDesktop && (
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggle}
          />
        )}
      </AnimatePresence>

      {/* Command menu/overlay based on device */}
      {isDesktop ? <CommandMenu /> : <CommandOverlay />}

      {/* Project modal */}
      <ProjectModal isOpen={projectModalOpen} onClose={() => setProjectModalOpen(false)} />

      {/* Sidebar toggle button */}
      <div className="fixed top-3 left-2 z-[100]">
        <button
          onClick={toggle}
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent/50 group"
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          {/* Different icon behavior for mobile vs desktop with smooth transitions */}
          <span className="relative flex items-center justify-center w-5 h-5">
            {/* Sidebar icon - visible on desktop or mobile closed */}
            <SidebarIcon 
              weight="duotone" 
              className={cn(
                "h-5 w-5 text-muted-foreground absolute transition-opacity duration-200",
                isOpen && !isDesktop ? "opacity-0" : "opacity-100 group-hover:opacity-0"
              )}
            />
            
            {/* Left Caret - for closing sidebar */}
            <CaretLeft 
              weight="duotone" 
              className={cn(
                "h-5 w-5 text-muted-foreground absolute transition-opacity duration-200",
                isOpen
                  ? isDesktop 
                    ? "opacity-0 group-hover:opacity-100" // Desktop: Only show on hover
                    : "opacity-100" // Mobile: Always show when open
                  : "opacity-0" // Hidden when sidebar is closed
              )}
            />
            
            {/* Right Caret - for opening sidebar */}
            <CaretRight 
              weight="duotone" 
              className={cn(
                "h-5 w-5 text-muted-foreground absolute transition-opacity duration-200",
                !isOpen
                  ? "opacity-0 group-hover:opacity-100" // Only visible on hover when closed
                  : "opacity-0" // Hidden when sidebar is open
              )}
            />
          </span>
        </button>
      </div>

      {/* Unified sidebar - adapts between mobile and desktop */}
      <motion.div
        className="fixed top-0 bottom-0 left-0 border-r border-border z-50 flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--sidebar)' }}
        initial={{ 
          width: isDesktop ? (isOpen ? 280 : 48) : 0,
          borderRightWidth: isDesktop || isOpen ? "1px" : "0px"
        }}
        animate={{
          width: isDesktop ? (isOpen ? 280 : 48) : (isOpen ? 280 : 0),
          borderRightWidth: isDesktop || isOpen ? "1px" : "0px",
          transition: {
            duration: initialLoadComplete ? 0.3 : 0,
            ease: [0.32, 0.72, 0, 1]
          }
        }}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top space with search button */}
          <div className="h-14 relative flex justify-between items-center px-2">
            {/* Button spacer to maintain layout when toggle button is outside */}
            <div className="h-8 w-8"></div>
            
            {/* Search button - only visible when sidebar is open */}
            <AnimatePresence>
              {isOpen && (
                <motion.button
                  onClick={() => setCommandMenuOpen(true)}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent/50 group"
                  aria-label="Search"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MagnifyingGlass 
                    weight="duotone" 
                    className="h-5 w-5 text-muted-foreground transition-colors duration-200 group-hover:text-foreground" 
                  />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          
          {/* New Chat button */}
          <div className="px-2 pb-2">
            <div className="group relative">
              <Link
                href="/"
                className={cn(
                  "flex items-center py-2 px-2 w-full min-h-[36px] hover:bg-accent/50 transition-colors rounded-md",
                  isDesktop && !isOpen ? "justify-center" : ""
                )}
                onClick={() => !isDesktop && toggle()}
              >
                <span className="text-muted-foreground">
                  <Plus weight="duotone" className="h-4 w-4" />
                </span>
                
                {/* Text label - only visible when sidebar is open */}
                <div className="overflow-hidden">
                  <AnimatePresence>
                    {isOpen && (
                      <motion.span
                        className="ml-2 text-sm text-foreground flex-1 leading-normal"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
                      >
                        new chat
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </Link>
            </div>
          </div>
          
          {/* Content area (Projects + Chats) with no fade gradients */}
          <div className="flex-1 overflow-hidden hover:overflow-y-auto">
            <div className="py-2">
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-3"
                  >
                    {/* Projects Section */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between py-1">
                        <span className="text-xs text-muted-foreground">projects</span>
                        
                        {/* Only show + button if projects exist */}
                        {projectsList.length > 0 && (
                          <button
                            onClick={() => setProjectModalOpen(true)}
                            className="h-5 w-5 flex items-center justify-center rounded-sm hover:bg-accent/50 transition-colors"
                            aria-label="New project"
                          >
                            <Plus weight="duotone" className="h-3 w-3 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                      
                      {/* Project list or new project button */}
                      {projectsList.length === 0 ? (
                        <div className="group relative">
                          <div
                            onClick={() => setProjectModalOpen(true)}
                            className="flex items-center py-2 px-2 w-full min-h-[36px] hover:bg-accent/50 transition-colors rounded-md text-left cursor-pointer"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && setProjectModalOpen(true)}
                          >
                            <FolderSimple weight="duotone" className="h-4 w-4 text-muted-foreground" />
                            <span className="ml-2 text-sm truncate text-muted-foreground flex-1 leading-normal">new project</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {projectsList.map((project: any) => (
                            <div key={project.id} className="group relative">
                              <div
                                onClick={() => {
                                  router.push(`/p/${project.id}`);
                                  if (!isDesktop) toggle();
                                }}
                                className={cn(
                                  "flex items-center py-2 px-2 w-full min-h-[36px] hover:bg-accent/50 transition-colors rounded-md text-left cursor-pointer",
                                  pathname.includes(`/p/${project.id}`) ? "bg-accent/70" : ""
                                )}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    router.push(`/p/${project.id}`);
                                    if (!isDesktop) toggle();
                                  }
                                }}
                              >
                                <FolderSimple weight="duotone" className="h-4 w-4 text-muted-foreground" />
                                <span className="ml-2 text-sm truncate text-foreground flex-1 leading-normal">{project.name}</span>
                                <span className="relative z-10">
                                  <ChatItemMenu chatId={project.id} isProject={true} />
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* User menu at the bottom */}
          <div className="pt-2 pb-2 flex items-center justify-center">
            <UserMenu />
          </div>
        </div>
      </motion.div>
    </>
  );
} 