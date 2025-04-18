"use client";

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/src/lib/utils';
import { useSidebar } from '../SidebarProvider';
import { Plus } from '@phosphor-icons/react';
import { useMediaQuery } from '@repo/design/hooks/use-media-query';

export function NewChatButton() {
  const { isOpen, toggle } = useSidebar();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
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
  );
} 