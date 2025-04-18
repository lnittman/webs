"use client";

import React from "react";
import { usePathname } from 'next/navigation';
import { useMediaQuery } from '@repo/design/hooks/use-media-query';
import { motion } from 'framer-motion';
import { useAtom } from 'jotai';
import { settingsModalOpenAtom } from '@/src/store/settingsStore';

import { CommandMenu } from './modal/command-menu';
import { Sidebar } from '../sidebar/Sidebar';
import { SettingsOverlay } from './modal/user-settings/SettingsOverlay';

import { SettingsModal } from './modal/user-settings';
import { useSidebar } from '../sidebar/SidebarProvider';


export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [settingsOpen, setSettingsOpen] = useAtom(settingsModalOpenAtom);

  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith('/signin') || pathname?.startsWith('/signup');

  if (isAuthRoute) {
    // For auth routes, render just the content without header or sidebar
    return children;
  }

  // For normal routes, render the full layout with sidebar
  return (
    <div className="flex min-h-screen flex-col">
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
      <CommandMenu />
      
      {/* Settings Modal & Overlay */}
      {isDesktop ? (
        <SettingsModal />
      ) : (
        <SettingsOverlay />
      )}
    </div>
  );
} 