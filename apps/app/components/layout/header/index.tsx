"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { KeyboardShortcuts } from "./components";
import { useMediaQuery } from "@repo/design/hooks/use-media-query";

export function Header() {
  const pathname = usePathname();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Don't render header on auth pages or desktop
  if (pathname?.startsWith('/signin') || pathname?.startsWith('/signup') || isDesktop) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-end bg-background/95 px-4 md:hidden">
      {/* Keyboard shortcuts handler */}
      <KeyboardShortcuts />
    </header>
  );
} 