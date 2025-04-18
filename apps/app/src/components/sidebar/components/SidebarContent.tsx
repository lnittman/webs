"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '../SidebarProvider';
import { ProjectsSection } from './ProjectsSection';
import { ChatsSection } from './ChatsSection';

interface SidebarContentProps {
  setProjectModalOpen: (value: boolean) => void;
}

export function SidebarContent({ setProjectModalOpen }: SidebarContentProps) {
  const { isOpen } = useSidebar();
  
  return (
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
              <ProjectsSection setProjectModalOpen={setProjectModalOpen} />
              
              {/* Chats Section */}
              <ChatsSection />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 