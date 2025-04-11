"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Link as LinkIcon, Copy, LinkedinLogo, FacebookLogo, RedditLogo, TwitterLogo, Check } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@repo/design/components/ui/button";
import { Input } from "@repo/design/components/ui/input";
import { Checkbox } from "@repo/design/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ShareChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatTitle: string;
}

export function ShareChatModal({ 
  isOpen, 
  onClose, 
  chatId,
  chatTitle
}: ShareChatModalProps) {
  const [step, setStep] = useState<'create' | 'created'>('create');
  const [isCreating, setIsCreating] = useState(false);
  const [publicLink, setPublicLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('create');
        setIsCreating(false);
        setPublicLink('');
        setIsCopied(false);
      }, 300); // Wait for close animation to finish
    }
  }, [isOpen]);

  // Focus link input when the link is created
  useEffect(() => {
    if (step === 'created' && linkInputRef.current) {
      linkInputRef.current.focus();
      linkInputRef.current.select();
    }
  }, [step]);

  // Handle backdrop click
  const handleBackdropClick = () => {
    if (!isCreating) {
      onClose();
    }
  };

  // Generate a link when create button is clicked
  const handleCreateLink = async () => {
    try {
      setIsCreating(true);
      
      // Call the share API to create a public link
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create shared link');
      }
      
      const data = await response.json();
      
      // Generate full URL for sharing
      const baseUrl = window.location.origin;
      const fullUrl = `${baseUrl}${data.url}`;
      setPublicLink(fullUrl);
      
      // Move to the created step
      setStep('created');
    } catch (error) {
      console.error("Failed to create public link:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Copy the link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicLink);
      setIsCopied(true);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  // Share via social media
  const handleShare = (platform: string) => {
    if (!publicLink) return;
    
    let shareUrl = '';
    const encodedUrl = encodeURIComponent(publicLink);
    const encodedTitle = encodeURIComponent(`Check out this chat: ${chatTitle}`);
    
    switch (platform) {
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
        break;
      case 'reddit':
        shareUrl = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank');
  };

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isCreating) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isCreating]);

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
            <AnimatePresence mode="wait">
              {step === 'create' ? (
                <CreateLinkStep 
                  key="create"
                  chatTitle={chatTitle}
                  onClose={onClose}
                  onCreateLink={handleCreateLink}
                  isCreating={isCreating}
                />
              ) : (
                <LinkCreatedStep 
                  key="created"
                  chatTitle={chatTitle}
                  publicLink={publicLink}
                  onClose={onClose}
                  onCopyLink={handleCopyLink}
                  isCopied={isCopied}
                  linkInputRef={linkInputRef}
                  onShareClick={handleShare}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Step 1: Create Link UI
function CreateLinkStep({ 
  chatTitle, 
  onClose, 
  onCreateLink, 
  isCreating
}: { 
  chatTitle: string;
  onClose: () => void; 
  onCreateLink: () => void;
  isCreating: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="rounded-lg bg-background shadow-lg overflow-hidden border border-border/50 flex flex-col"
    >
      {/* Header with close button */}
      <div className="flex items-center justify-between border-b p-3 relative">
        <h3 className="text-foreground text-sm font-normal">share chat publicly</h3>
        <button 
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent/50 transition-colors"
          disabled={isCreating}
        >
          <X weight="duotone" className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-foreground mb-4">
          anyone with the link can view this chat up to this point. future messages will not be shared.
        </p>
        
        {/* Link preview */}
        <div className="relative flex items-center w-full p-2 rounded-md bg-accent/20 border border-border/50 text-muted-foreground mb-6">
          <span className="pl-2 truncate text-sm">
            {window.location.origin}/share/...
          </span>
        </div>
        
        {/* Button row */}
        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={onClose}
            disabled={isCreating}
            className="text-xs text-foreground w-24"
          >
            cancel
          </Button>
          <Button 
            type="button" 
            variant="default" 
            onClick={onCreateLink}
            disabled={isCreating}
            className="w-24 text-xs"
            size="sm"
          >
            {isCreating ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                <span>creating...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <LinkIcon weight="duotone" className="h-4 w-4" />
                <span>create</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Step 2: Link Created UI
function LinkCreatedStep({ 
  chatTitle,
  publicLink, 
  onClose, 
  onCopyLink, 
  isCopied,
  linkInputRef,
  onShareClick
}: { 
  chatTitle: string;
  publicLink: string;
  onClose: () => void;
  onCopyLink: () => void;
  isCopied: boolean;
  linkInputRef: React.RefObject<HTMLInputElement>;
  onShareClick: (platform: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="rounded-lg bg-background shadow-lg overflow-hidden border border-border/50 flex flex-col"
    >
      {/* Header with close button */}
      <div className="flex items-center justify-between border-b p-3 relative">
        <h3 className="text-foreground text-sm font-normal">share link created</h3>
        <button 
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent/50 transition-colors"
        >
          <X weight="duotone" className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-foreground mb-2">
          a public link to your chat has been created. manage previously shared chats at any time via <span className="underline">settings</span>.
        </p>
        
        {/* Link input with copy button */}
        <div className="relative flex items-center w-full mb-6 mt-4">
          <Input
            ref={linkInputRef}
            type="text"
            value={publicLink}
            readOnly
            className="pr-24 rounded-md bg-accent/20 border-border/50"
          />
          <Button 
            type="button" 
            variant="default" 
            size="sm"
            onClick={onCopyLink}
            className={cn(
              "absolute right-1 h-8 rounded-md transition-colors w-24",
              isCopied ? "bg-green-600 hover:bg-green-700" : ""
            )}
          >
            <div className="flex items-center gap-1.5">
              {isCopied ? (
                <>
                  <Check weight="bold" className="h-3.5 w-3.5" />
                  <span>copied</span>
                </>
              ) : (
                <>
                  <Copy weight="duotone" className="h-3.5 w-3.5" />
                  <span>copy</span>
                </>
              )}
            </div>
          </Button>
        </div>
        
        {/* Social sharing options */}
        <div className="flex justify-center gap-4 mt-4">
          <button 
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => onShareClick('linkedin')}
          >
            <div className="h-10 w-10 rounded-full bg-accent/30 flex items-center justify-center">
              <LinkedinLogo weight="duotone" className="h-5 w-5" />
            </div>
            <span className="text-xs">LinkedIn</span>
          </button>
          
          <button 
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => onShareClick('facebook')}
          >
            <div className="h-10 w-10 rounded-full bg-accent/30 flex items-center justify-center">
              <FacebookLogo weight="duotone" className="h-5 w-5" />
            </div>
            <span className="text-xs">Facebook</span>
          </button>
          
          <button 
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => onShareClick('reddit')}
          >
            <div className="h-10 w-10 rounded-full bg-accent/30 flex items-center justify-center">
              <RedditLogo weight="duotone" className="h-5 w-5" />
            </div>
            <span className="text-xs">Reddit</span>
          </button>
          
          <button 
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => onShareClick('twitter')}
          >
            <div className="h-10 w-10 rounded-full bg-accent/30 flex items-center justify-center">
              <TwitterLogo weight="duotone" className="h-5 w-5" />
            </div>
            <span className="text-xs">X</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
} 