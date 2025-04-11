"use client";

import React, { useState } from "react";
import { 
  Plus,
  FileArrowUp,
  Camera,
  Wrench
} from "@phosphor-icons/react";
import { Button } from "@repo/design/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/design/components/ui/dropdown-menu";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface CommandMenuProps {
  disabled?: boolean;
}

export function CommandMenu({ disabled = false }: CommandMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleUploadFile = () => {
    console.log("Upload a file clicked");
  };

  const handleTakeScreenshot = () => {
    console.log("Take a screenshot clicked");
  };

  const handleManageTools = () => {
    console.log("Manage tools clicked");
  };

  return (
    <DropdownMenuPrimitive.Root onOpenChange={setIsOpen} open={isOpen}>
      <DropdownMenuPrimitive.Trigger asChild>
        <Button 
          type="button" 
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full bg-muted/40 border-input/40 text-muted-foreground hover:text-foreground flex items-center justify-center hover:bg-muted hover:border-input transition-colors duration-200"
          disabled={disabled}
        >
          <Plus 
            weight="duotone" 
            className={`h-4 w-4 transition-transform duration-200 ease-in-out ${isOpen ? 'rotate-45' : 'rotate-0'}`} 
          />
        </Button>
      </DropdownMenuPrimitive.Trigger>
      <AnimatePresence>
        {isOpen && (
          <DropdownMenuPrimitive.Portal forceMount>
            <DropdownMenuPrimitive.Content 
              asChild
              side="bottom"
              align="start"
              alignOffset={0}
              sideOffset={8}
            >
              <motion.div
                className="z-50 min-w-[180px] overflow-hidden rounded-xl border border-border/20 bg-popover/95 backdrop-blur-sm p-1.5 shadow-xl"
                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                transition={{ 
                  duration: 0.2,
                  ease: [0.32, 0.72, 0, 1]
                }}
              >
                <DropdownMenuPrimitive.Item 
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors text-foreground",
                    "focus:bg-accent focus:text-accent-foreground",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  )}
                  onClick={handleUploadFile}
                >
                  <FileArrowUp weight="duotone" className="h-4 w-4 mr-1.5" />
                  <span>upload a file</span>
                </DropdownMenuPrimitive.Item>
                
                <DropdownMenuPrimitive.Item 
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors text-foreground",
                    "focus:bg-accent focus:text-accent-foreground",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  )}
                  onClick={handleTakeScreenshot}
                >
                  <Camera weight="duotone" className="h-4 w-4 mr-1.5" />
                  <span>take a screenshot</span>
                </DropdownMenuPrimitive.Item>
                
                <DropdownMenuPrimitive.Item 
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors text-foreground",
                    "focus:bg-accent focus:text-accent-foreground",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  )}
                  onClick={handleManageTools}
                >
                  <Wrench weight="duotone" className="h-4 w-4 mr-1.5" />
                  <span>manage tools</span>
                </DropdownMenuPrimitive.Item>
              </motion.div>
            </DropdownMenuPrimitive.Content>
          </DropdownMenuPrimitive.Portal>
        )}
      </AnimatePresence>
    </DropdownMenuPrimitive.Root>
  );
} 