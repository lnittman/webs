"use client";

import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';

import { useMediaQuery } from '@repo/design/hooks/use-media-query';

// Import modular components
import { SidebarToggle } from './components/SidebarToggle';
import { MobileOverlay } from './components/MobileOverlay';
import { SidebarHeader } from './components/SidebarHeader';
import { NewChatButton } from './components/NewChatButton';
import { SidebarContent } from './components/SidebarContent';
import { UserMenu } from './components/UserMenu';
import { useSidebar } from './SidebarProvider';
import { CommandMenu } from '../layout/modal/command-menu';
import { CommandOverlay } from '../layout/modal/command-menu/CommandOverlay';
import { ProjectModal } from '../layout/modal/ProjectModal';

export function Sidebar() {
  const { isOpen, setIsOpen } = useSidebar();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  
  // Track if initial load is complete to prevent animations on first render
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
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
  
  return (
    <>
      {/* Mobile overlay when sidebar is open */}
      <MobileOverlay />

      {/* Command menu/overlay based on device */}
      {isDesktop ? <CommandMenu /> : <CommandOverlay />}

      {/* Project modal */}
      <ProjectModal isOpen={projectModalOpen} onClose={() => setProjectModalOpen(false)} />

      {/* Sidebar toggle button */}
      <SidebarToggle />

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
          <SidebarHeader />
          
          {/* New Chat button */}
          <NewChatButton />
          
          {/* Content area with Projects and Chats */}
          <SidebarContent setProjectModalOpen={setProjectModalOpen} />

          {/* User menu at the bottom */}
          <div className="pt-2 pb-2 flex items-center justify-center">
            <UserMenu />
          </div>
        </div>
      </motion.div>
    </>
  );
} 