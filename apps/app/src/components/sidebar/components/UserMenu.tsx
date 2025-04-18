"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SignIn, SignOut, CaretDown, CaretUp, Gear, Moon, Sun, Desktop, Translate, CaretRight } from "@phosphor-icons/react";
import { useClerk, useAuth, useUser } from "@clerk/nextjs";
import { Button } from "@repo/design/components/ui/button";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { SignOutButton } from "@clerk/nextjs";
import { useSidebar } from "../SidebarProvider";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";
import { useTheme } from "next-themes";
import { Tabs, TabsList, TabsTrigger } from "@repo/design/components/ui/tabs";
import { useAtom } from "jotai";
import { themeAtom, settingsModalOpenAtom } from "@/src/store/settingsStore";

export function UserMenu() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { isOpen } = useSidebar();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useAtom(themeAtom);
  const [, setSettingsOpen] = useAtom(settingsModalOpenAtom);
  // Use the next-themes hook only for system resolution
  const { resolvedTheme, setTheme: setNextTheme } = useTheme();

  // Get user initials for avatar fallback
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : user?.emailAddresses?.[0]?.emailAddress?.charAt(0).toUpperCase() || "?";

  const handleSignOut = () => {
    signOut();
  };

  const handleThemeChange = (value: string) => {
    // Update both state stores
    setTheme(value as 'light' | 'dark' | 'system');
    setNextTheme(value);
  };

  // Open settings modal and close dropdown
  const handleOpenSettings = () => {
    setMenuOpen(false);
    setSettingsOpen(true);
  };

  if (isSignedIn) {
    return (
      <div className={cn(
        "w-full flex justify-center",
        !isOpen && "px-0" // Remove padding when sidebar is collapsed
      )}>
        <DropdownMenuPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuPrimitive.Trigger asChild>
            <button 
              className={cn(
                "flex items-center justify-between w-full transition-colors py-2 rounded-md focus:outline-none", // Remove focus ring
                isOpen ? "px-3 hover:bg-transparent" : "px-0 justify-center"
              )}
            >
              <div className={cn(
                "flex items-center gap-2",
                !isOpen && "justify-center w-full" // Center the avatar when sidebar is collapsed
              )}>
                <motion.div 
                  className="h-8 w-8 rounded-full bg-background text-foreground flex items-center justify-center text-xs font-medium flex-shrink-0"
                  initial={{ borderWidth: 1 }}
                  whileHover={{ borderWidth: 2 }}
                  transition={{ duration: 0.2 }} // Animate border change
                  style={{ 
                    borderColor: 'var(--border)',
                    borderStyle: 'solid'
                  }}
                >
                  {initials}
                </motion.div>
                
                {/* Only show user name when sidebar is open */}
                {isOpen && (
                  <div className="relative overflow-hidden h-8">
                    <motion.div
                      className="h-full flex items-center"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
                    >
                      <span className="truncate text-sm text-foreground whitespace-nowrap">
                        {user?.firstName || "User"}
                      </span>
                    </motion.div>
                  </div>
                )}
              </div>
              
              {/* Animated chevron - only show when sidebar is open */}
              {isOpen && (
                <div className="flex items-center justify-center w-5 h-5 transition-all duration-200">
                  <AnimatePresence mode="wait" initial={false}>
                    {menuOpen ? (
                      <motion.div
                        key="up"
                        initial={{ opacity: 0, y: 2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -2 }}
                        transition={{ duration: 0.15 }}
                      >
                        <CaretUp weight="duotone" className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="down"
                        initial={{ opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 2 }}
                        transition={{ duration: 0.15 }}
                      >
                        <CaretDown weight="duotone" className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </button>
          </DropdownMenuPrimitive.Trigger>
          
          <AnimatePresence>
            {menuOpen && (
              <DropdownMenuPrimitive.Portal forceMount>
                <DropdownMenuPrimitive.Content
                  asChild
                  className={cn(
                    "z-50 min-w-[250px] overflow-hidden rounded-lg border border-border/20 bg-popover/95 backdrop-blur-sm p-1.5 shadow-xl",
                    "data-[side=bottom]:origin-top data-[side=top]:origin-bottom"
                  )}
                  align={isOpen ? "center" : "start"} 
                  side="top"
                  sideOffset={8}
                  alignOffset={isOpen ? 0 : 14} // Add offset when sidebar is collapsed to match open position
                >
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 500, 
                      damping: 30,
                      mass: 0.8
                    }}
                  >
                    <div className="px-2 py-1.5 mb-1 border-b border-slate-500/10">
                      <p className="text-sm font-medium text-foreground">{user?.fullName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{user?.emailAddresses?.[0]?.emailAddress}</p>
                    </div>

                    <DropdownMenuPrimitive.Item
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors text-foreground",
                        "focus:bg-accent focus:text-accent-foreground mt-1",
                        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      )}
                      onClick={handleOpenSettings}
                    >
                      <Gear className="w-4 h-4 mr-2 text-muted-foreground" weight="duotone" />
                      <span>settings</span>
                    </DropdownMenuPrimitive.Item>

                    {/* Divider before theme switcher */}
                    <div className="my-1.5 border-t border-slate-500/10"></div>

                    {/* Theme selector using Tabs component - no title */}
                    <div className="px-2 py-1.5">
                      <Tabs 
                        defaultValue={theme} 
                        value={theme}
                        onValueChange={handleThemeChange}
                        className="flex flex-col"
                      >
                        <TabsList className="bg-accent/30 w-full h-9 p-1 rounded-md grid grid-cols-3 gap-1 relative">
                          {/* Active background indicator with animation */}
                          <AnimatePresence initial={false}>
                            <motion.div 
                              key={theme}
                              className="absolute rounded-sm bg-background shadow-sm"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{
                                top: 4,
                                bottom: 4,
                                left: theme === 'light' ? 4 : (theme === 'dark' ? '33.33%' : '66.66%'),
                                width: 'calc(33.33% - 5.33px)',
                              }}
                            />
                          </AnimatePresence>

                          {/* Tab triggers with static icons (no animations) */}
                          <TabsTrigger 
                            value="light" 
                            className="h-full w-full rounded-sm transition-all duration-200 hover:bg-background/60 focus:outline-none flex items-center justify-center z-10"
                          >
                            <Sun 
                              weight="duotone" 
                              className={cn(
                                "h-4 w-4 transition-colors duration-300",
                                theme === 'light' ? "text-foreground" : "text-muted-foreground"
                              )} 
                            />
                          </TabsTrigger>
                          <TabsTrigger 
                            value="dark" 
                            className="h-full w-full rounded-sm transition-all duration-200 hover:bg-background/60 focus:outline-none flex items-center justify-center z-10"
                          >
                            <Moon 
                              weight="duotone" 
                              className={cn(
                                "h-4 w-4 transition-colors duration-300",
                                theme === 'dark' ? "text-foreground" : "text-muted-foreground"
                              )} 
                            />
                          </TabsTrigger>
                          <TabsTrigger 
                            value="system" 
                            className="h-full w-full rounded-sm transition-all duration-200 hover:bg-background/60 focus:outline-none flex items-center justify-center z-10"
                          >
                            <Desktop 
                              weight="duotone" 
                              className={cn(
                                "h-4 w-4 transition-colors duration-300",
                                theme === 'system' ? "text-foreground" : "text-muted-foreground"
                              )} 
                            />
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    {/* Divider after theme switcher */}
                    <div className="my-1.5 border-t border-slate-500/10"></div>

                    <SignOutButton>
                      <DropdownMenuPrimitive.Item
                        className={cn(
                          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                          "focus:bg-accent focus:text-accent-foreground mt-1 text-red-500",
                          "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                        )}
                      >
                        <SignOut className="w-4 h-4 mr-2 text-red-500" weight="duotone" />
                        <span>log out</span>
                      </DropdownMenuPrimitive.Item>
                    </SignOutButton>
                  </motion.div>
                </DropdownMenuPrimitive.Content>
              </DropdownMenuPrimitive.Portal>
            )}
          </AnimatePresence>
        </DropdownMenuPrimitive.Root>
      </div>
    );
  }
  
  return (
    <div className="w-full flex justify-center px-3">
      <Button 
        className="rounded-full flex items-center h-9 px-4 text-xs font-medium bg-primary text-primary-foreground transition-colors duration-200 hover:bg-primary/90"
        asChild
      >
        <Link href="/signin">
          <SignIn weight="duotone" className="h-3.5 w-3.5" />
          <span>log in</span>
        </Link>
      </Button>
    </div>
  );
} 