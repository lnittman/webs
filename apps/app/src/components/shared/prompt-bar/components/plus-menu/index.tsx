"use client";

import React, { useState, useEffect } from "react";

import { Plus } from "@phosphor-icons/react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@repo/design/components/ui/button";

import { cn } from "@/src/lib/utils";
import { UploadFileButton } from "./components/upload-file-button";
import { ScreenshotButton } from "./components/screenshot-button";
import { ManageToolsButton } from "./components/manage-tools-button";

interface PlusMenuProps {
  disabled?: boolean;
}

export function PlusMenu({ disabled = false }: PlusMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [showHoverEffect, setShowHoverEffect] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setShowHoverEffect(true);
    } else if (!isHovering) {
      setShowHoverEffect(false);
    }
  }, [isOpen, isHovering]);
  
  return (
    <DropdownMenuPrimitive.Root onOpenChange={setIsOpen} open={isOpen}>
      <DropdownMenuPrimitive.Trigger asChild>
        <Button 
          type="button" 
          variant="outline"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-lg border flex items-center justify-center transition-all duration-300 text-muted-foreground",
            showHoverEffect 
              ? "bg-muted border-input" 
              : "bg-muted/40 border-input/40 hover:text-foreground hover:bg-muted hover:border-input"
          )}
          disabled={disabled}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
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
                className="z-50 min-w-[180px] overflow-hidden rounded-xl border border-border/20 bg-popover/95 backdrop-blur-sm p-1.5 shadow-md"
                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                transition={{ 
                  duration: 0.2,
                  ease: [0.32, 0.72, 0, 1]
                }}
              >
                <UploadFileButton />
                <ScreenshotButton />
                <ManageToolsButton />
              </motion.div>
            </DropdownMenuPrimitive.Content>
          </DropdownMenuPrimitive.Portal>
        )}
      </AnimatePresence>
    </DropdownMenuPrimitive.Root>
  );
} 