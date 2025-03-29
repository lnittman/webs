"use client";

import React from "react";
import Link from "next/link";
import { SignIn, ArrowRight, X } from "@phosphor-icons/react";
import { useClerk, useAuth, useUser } from "@clerk/nextjs";
import { useAtom } from "jotai";
import { mobileSheetOpenAtom } from "@/lib/store/settingsStore";
import { cn } from "@repo/design/lib/utils";

import { Button } from "@repo/design/components/ui/button";

export function MobileSheet() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isSheetOpen, setIsSheetOpen] = useAtom(mobileSheetOpenAtom);

  // Add body class when sheet is open to enable blur
  React.useEffect(() => {
    if (isSheetOpen) {
      document.body.classList.add('sheet-open');
      // Prevent scrolling when sheet is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('sheet-open');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.classList.remove('sheet-open');
      document.body.style.overflow = '';
    };
  }, [isSheetOpen]);

  const handleSignOut = () => {
    signOut();
    setIsSheetOpen(false);
  };

  if (!isSheetOpen) return null;

  // Simple menu item component for the sheet
  const MenuItem = ({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) => (
    <Link href={href} className="block px-4 py-3 rounded-lg text-sm text-foreground hover:bg-muted" onClick={onClick}>
      {label}
    </Link>
  );

  return (
    <div className="fixed inset-0 z-[999] flex flex-col">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in-0" 
        onClick={() => setIsSheetOpen(false)}
      />
      
      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-background border border-border border-b-0 rounded-t-lg shadow-lg animate-in slide-in-from-bottom fade-in-0 z-[1000]">
        {/* Handle and close button */}
        <div className="flex items-center justify-between p-4">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto" />
          <button 
            onClick={() => setIsSheetOpen(false)}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted/50 text-foreground"
          >
            <X weight="bold" className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        
        {/* Content */}
        <div className="max-h-[80vh] overflow-y-auto">
          {isSignedIn ? (
            <div className="flex flex-col space-y-2 p-4">
              <div className="flex items-center justify-center mb-4">
                <span className="text-xl font-medium text-primary">webs</span>
              </div>
              <MenuItem href="/settings" label="settings" onClick={() => setIsSheetOpen(false)} />
              <MenuItem href="/help" label="help & feedback" onClick={() => setIsSheetOpen(false)} />
              <button 
                onClick={handleSignOut} 
                className="w-full text-left px-4 py-3 rounded-lg text-sm text-foreground hover:bg-muted"
              >
                sign out
              </button>
            </div>
          ) : (
            <div className="flex flex-col justify-between min-h-[60vh] p-4">
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-3xl mr-2">🕸️</span>
                  <span className="text-lg font-medium text-foreground">webs</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  sign in to view history
                </p>
              </div>
              <div className="mt-auto p-4">
                <Button
                  asChild
                  className="w-full rounded-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 hover:transition-colors hover:duration-200 flex items-center justify-center"
                  onClick={() => setIsSheetOpen(false)}
                >
                  <Link href="/signin">
                    <SignIn weight="duotone" className="h-4 w-4 mr-2" />
                    <span>sign in</span>
                    <ArrowRight weight="bold" className="h-4 w-4 ml-auto arrow-icon" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 