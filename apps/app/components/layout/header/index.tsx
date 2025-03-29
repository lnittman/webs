"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { MenuButton, Logo, UserMenu, KeyboardShortcuts } from "./components";

export function Header() {
  const pathname = usePathname();

  // Don't render header on auth pages
  if (pathname?.startsWith('/signin') || pathname?.startsWith('/signup')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between bg-background/95 px-4 md:px-6">
      {/* Left side - Menu button */}
      <Logo />
      
      {/* Right side - Auth */}
      <div className="flex items-center gap-2">
        <UserMenu />
        <MenuButton />
      </div>

      {/* Keyboard shortcuts handler */}
      <KeyboardShortcuts />
    </header>
  );
} 