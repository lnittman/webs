"use client";

import { useEffect } from "react";
import { useAtom } from "jotai";
import { commandMenuOpenAtom } from "@/lib/store/settingsStore";
import { useIsMobile } from "@repo/design/hooks/use-mobile";

export function KeyboardShortcuts() {
  const [_, setCommandOpen] = useAtom(commandMenuOpenAtom);
  const isMobile = useIsMobile();

  // Handle keyboard shortcut for command menu
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey) && !isMobile) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setCommandOpen]);

  return null; // This component doesn't render anything
} 