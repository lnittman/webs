"use client";

import { MagnifyingGlass } from '@phosphor-icons/react';
import { useAtom } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';

import { commandMenuOpenAtom } from '@/src/store/settingsStore';
import { useSidebar } from '../SidebarProvider';

export function SidebarHeader() {
  const { isOpen } = useSidebar();
  const [, setCommandMenuOpen] = useAtom(commandMenuOpenAtom);

  return (
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
  );
} 