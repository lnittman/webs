"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAtom } from "jotai";
import { sidebarOpenAtom } from "@/lib/store/settingsStore";
import { useMediaQuery } from "@repo/design/hooks/use-media-query";

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  setIsOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useAtom(sidebarOpenAtom);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  // State to track if initial setup is done to prevent flicker
  const [isInitialised, setIsInitialised] = useState(false);

  useEffect(() => {
    // Only run this effect once after initial mount and media query is stable
    if (!isInitialised) {
      if (!isDesktop) {
        // Ensure sidebar is closed on mobile initially
        setIsOpen(false);
      } else {
        // On desktop, respect the atom's default (which we set to false)
        // If storage had 'true', this overrides it for initial mount consistency
        // but we might want it to remember the last state. 
        // Let's try defaulting it to closed on initial desktop load too for consistency.
        const storedValue = localStorage.getItem('sidebarOpenAtom');
        if (storedValue === null) { // Only force closed if no stored state exists
           setIsOpen(false); 
        }
      }
      setIsInitialised(true);
    }
  }, [isDesktop, setIsOpen, isInitialised]);

  const toggle = () => {
    setIsOpen(!isOpen);
  };

  // Render null until initialised to prevent flash of incorrect state
  if (!isInitialised && !isDesktop) {
    return null;
  }

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}; 