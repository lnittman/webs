"use client";

import React, { useState, useRef, useEffect } from "react";
import { X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@repo/design/components/ui/button";
import { Input } from "@repo/design/components/ui/input";

interface RenameChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newTitle: string) => void;
  isRenaming: boolean;
  initialTitle: string;
}

export function RenameChatModal({ 
  isOpen, 
  onClose, 
  onRename, 
  isRenaming,
  initialTitle
}: RenameChatModalProps) {
  const [newTitle, setNewTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Set initial title when modal opens - simplify focusing logic
  useEffect(() => {
    if (isOpen) {
      setNewTitle(initialTitle);
      
      // Clear any existing timeout
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
      
      // Just focus once when the modal opens
      focusTimeoutRef.current = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const length = initialTitle.length;
          inputRef.current.setSelectionRange(length, length);
        }
      }, 50);
      
      return () => {
        if (focusTimeoutRef.current) {
          clearTimeout(focusTimeoutRef.current);
        }
      };
    }
  }, [isOpen, initialTitle]);
  
  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isRenaming) {
      onClose();
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim() && newTitle !== initialTitle) {
      onRename(newTitle.trim());
    } else if (newTitle === initialTitle) {
      onClose();
    }
  };

  // Handle escape key - two-stage: first unfocus, then close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isRenaming) {
        e.preventDefault();
        
        // If the input is focused, just blur it first time
        if (document.activeElement === inputRef.current) {
          inputRef.current?.blur();
        } else {
          // If input is already not focused, close the modal
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isRenaming]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop with blur */}
          <motion.div 
            className="fixed inset-0 bg-background/60 backdrop-blur-md" 
            onClick={handleBackdropClick}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          
          {/* Modal dialog */}
          <motion.div 
            className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-lg bg-background shadow-lg overflow-hidden border border-border/50 flex flex-col">
              {/* Header with close button */}
              <div className="flex items-center justify-between border-b p-3 relative">
                <h3 className="text-foreground text-sm font-normal">rename chat</h3>
                <button 
                  onClick={onClose}
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent/50 transition-colors"
                  disabled={isRenaming}
                >
                  <X weight="duotone" className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <p className="text-muted-foreground text-sm mb-4">
                  choose a new title for this chat
                </p>
                
                <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
                  <div className="w-full mb-4 h-[44px] flex items-center relative border rounded-md border-input overflow-hidden">
                    <Input
                      ref={inputRef}
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="enter a new title"
                      className="w-full text-foreground h-full py-0 px-3 leading-normal box-border border-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 absolute inset-0"
                      style={{ 
                        lineHeight: '1.5',
                        fontSize: '0.875rem'
                      }}
                      disabled={isRenaming}
                      spellCheck={false}
                      autoComplete="off"
                      autoFocus
                    />
                  </div>
                  
                  {/* Button row */}
                  <div className="flex justify-end gap-2 mt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                      }}
                      disabled={isRenaming}
                      className="text-xs text-foreground w-20"
                    >
                      cancel
                    </Button>
                    <Button 
                      type="submit" 
                      variant="default" 
                      size="sm"
                      disabled={!newTitle.trim() || isRenaming || newTitle === initialTitle}
                      className="text-xs text-primary-foreground w-20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isRenaming ? "saving..." : "save"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 