"use client";

import React from "react";
import { X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@repo/design/components/ui/button";

interface DeleteChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  chatTitle: string;
}

export function DeleteChatModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isDeleting,
  chatTitle 
}: DeleteChatModalProps) {
  // Handle backdrop click
  const handleBackdropClick = () => {
    if (!isDeleting) {
      onClose();
    }
  };

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
          >
            <div className="rounded-lg bg-background shadow-lg overflow-hidden border border-border/50 flex flex-col">
              {/* Header with close button */}
              <div className="flex items-center justify-between border-b p-3 relative">
                <h3 className="text-foreground text-sm font-normal">delete chat?</h3>
                <button 
                  onClick={onClose}
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent/50 transition-colors"
                  disabled={isDeleting}
                >
                  <X weight="duotone" className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <p className="text-sm text-foreground mb-2">
                  this will delete <span className="font-medium">{chatTitle}</span>.
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  visit <span className="underline">settings</span> to delete any memories saved during this chat.
                </p>
                
                {/* Button row */}
                <div className="flex justify-end gap-2 mt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={onClose}
                    disabled={isDeleting}
                    className="text-xs w-24"
                  >
                    cancel
                  </Button>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm"
                    onClick={onConfirm}
                    disabled={isDeleting}
                    className="text-xs w-24"
                  >
                    {isDeleting ? "deleting..." : "delete"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 