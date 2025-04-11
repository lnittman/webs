"use client";

import React from "react";
import { usePathname } from 'next/navigation';
import { Header, CommandMenu, MobileSheet, Sidebar, SettingsOverlay } from '@/components/layout';
import { useSidebar } from './sidebar/SidebarProvider';
import { useMediaQuery } from '@repo/design/hooks/use-media-query';
import { motion } from 'framer-motion';
import { useAtom } from 'jotai';
import { settingsModalOpenAtom } from '@/lib/store/settingsStore';
import { SettingsModal } from './modal/user-settings';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [settingsOpen, setSettingsOpen] = useAtom(settingsModalOpenAtom);

  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith('/signin') || pathname?.startsWith('/signup');

  // Handler to close the settings modal
  const handleCloseSettings = () => {
    setSettingsOpen(false);
  };

  if (isAuthRoute) {
    // For auth routes, render just the content without header or sidebar
    return children;
  }

  // For normal routes, render the full layout with sidebar and header
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Sidebar />

      <motion.main
        className="flex-1"
        initial={false}
        animate={{
          marginLeft: isDesktop ? (isOpen ? 280 : 48) : 0
        }}
        transition={{
          duration: 0.3,
          ease: [0.32, 0.72, 0, 1]
        }}
      >
        {children}
      </motion.main>

      {/* Portal components rendered at the root layout level for proper stacking context */}
      {/* These components use Jotai atoms from settingsStore for state management */}
      <MobileSheet />
      <CommandMenu />
      
      {/* Settings Modal & Overlay */}
      {isDesktop ? (
        <SettingsModal isOpen={settingsOpen} onClose={handleCloseSettings} />
      ) : (
        <SettingsOverlay />
      )}
    </div>
  );
} 