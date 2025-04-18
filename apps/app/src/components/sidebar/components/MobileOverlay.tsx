"use client";

import { motion, AnimatePresence } from 'framer-motion';

import { useMediaQuery } from '@repo/design/hooks/use-media-query';

import { useSidebar } from '../SidebarProvider';

export function MobileOverlay() {
  const { isOpen, toggle } = useSidebar();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
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
  );
} 