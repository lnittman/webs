"use client";

import { cn } from '@/src/lib/utils';
import { useSidebar } from '../SidebarProvider';
import { 
  CaretLeft,
  CaretRight,
  Sidebar as SidebarIcon
} from '@phosphor-icons/react';

export function SidebarToggle() {
  const { isOpen, toggle } = useSidebar();
  
  return (
    <div className="fixed top-3 left-2 z-[100]">
      <button
        onClick={toggle}
        className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent/50 group"
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {/* Different icon behavior for mobile vs desktop with smooth transitions */}
        <span className="relative flex items-center justify-center w-5 h-5">
          {/* Sidebar icon - visible on desktop or mobile closed */}
          <SidebarIcon 
            weight="duotone" 
            className={cn(
              "h-5 w-5 text-muted-foreground absolute transition-opacity duration-200",
              isOpen ? "opacity-0" : "opacity-100 group-hover:opacity-0"
            )}
          />
          
          {/* Left Caret - for closing sidebar */}
          <CaretLeft 
            weight="duotone" 
            className={cn(
              "h-5 w-5 text-muted-foreground absolute transition-opacity duration-200",
              isOpen
                ? "opacity-0 group-hover:opacity-100" // Desktop: Only show on hover
                : "opacity-0" // Hidden when sidebar is closed
            )}
          />
          
          {/* Right Caret - for opening sidebar */}
          <CaretRight 
            weight="duotone" 
            className={cn(
              "h-5 w-5 text-muted-foreground absolute transition-opacity duration-200",
              !isOpen
                ? "opacity-0 group-hover:opacity-100" // Only visible on hover when closed
                : "opacity-0" // Hidden when sidebar is open
            )}
          />
        </span>
      </button>
    </div>
  );
} 