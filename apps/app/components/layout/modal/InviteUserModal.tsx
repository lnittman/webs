"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Check, Plus, User, UserPlus, Envelope, Gear } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@repo/design/components/ui/button";
import { Input } from "@repo/design/components/ui/input";
import { cn } from "@/lib/utils";

// Add custom styles to hide scrollbars across browsers
const customStyles = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }

  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatTitle: string;
}

export function InviteUserModal({ 
  isOpen, 
  onClose, 
  chatId,
  chatTitle
}: InviteUserModalProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteResults, setInviteResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("PARTICIPANT");
  const inputRef = useRef<HTMLInputElement>(null);
  const emailsContainerRef = useRef<HTMLDivElement>(null);
  
  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setEmails([]);
        setCurrentEmail("");
        setIsInviting(false);
        setInviteResults(null);
        setError(null);
        setSelectedRole("PARTICIPANT");
      }, 300); // Wait for close animation to finish
    }
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Scroll to the end of the emails container when a new email is added
  useEffect(() => {
    if (emailsContainerRef.current && emails.length > 0) {
      emailsContainerRef.current.scrollTo({
        left: emailsContainerRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
  }, [emails]);

  // Handle backdrop click
  const handleBackdropClick = () => {
    if (!isInviting) {
      onClose();
    }
  };

  // Handle email input
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentEmail(e.target.value);
    setError(null);
  };

  // Add email to the list
  const addEmail = () => {
    const trimmedEmail = currentEmail.trim();
    
    // Basic email validation
    if (!trimmedEmail) return;
    
    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("please enter a valid email address");
      return;
    }
    
    // Check if email already exists in the list
    if (emails.includes(trimmedEmail)) {
      setError("this email has already been added");
      return;
    }
    
    // Add email and reset the input
    setEmails([...emails, trimmedEmail]);
    setCurrentEmail("");
    setError(null);
  };

  // Handle key press to add email
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail();
    }
  };

  // Remove email from the list
  const removeEmail = (indexToRemove: number) => {
    setEmails(prevEmails => prevEmails.filter((_, index) => index !== indexToRemove));
  };

  // Send invitations
  const sendInvites = async () => {
    if (emails.length === 0) {
      setError("please add at least one email address");
      return;
    }
    
    try {
      setIsInviting(true);
      setError(null);
      
      // Send invites using the chat invitation API with corrected path
      const response = await fetch(`/api/chats/${chatId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails,
          role: selectedRole
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'failed to send invites');
      }
      
      const data = await response.json();
      setInviteResults(data.results);
      
    } catch (error) {
      console.error("Failed to send invites:", error);
      setError((error as Error).message || "failed to send invites");
    } finally {
      setIsInviting(false);
    }
  };

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isInviting) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isInviting]);

  // Define the permission options
  const permissionOptions = [
    {
      value: "VIEWER",
      label: "viewer (can only view)",
      icon: <User weight="duotone" className="h-3.5 w-3.5 text-muted-foreground" />,
      description: "can view messages, but cannot send any"
    },
    {
      value: "PARTICIPANT",
      label: "participant (can chat)",
      icon: <UserPlus weight="duotone" className="h-3.5 w-3.5 text-muted-foreground" />,
      description: "can view and send messages"
    },
    {
      value: "MODERATOR",
      label: "moderator (can invite others)",
      icon: <Gear weight="duotone" className="h-3.5 w-3.5 text-muted-foreground" />,
      description: "can chat and invite other users"
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Include custom styles */}
          <style jsx global>{customStyles}</style>
          
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
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 30,
              mass: 0.8
            }}
          >
            <div className="rounded-lg bg-background shadow-lg overflow-hidden border border-border/50 flex flex-col backdrop-blur-sm">
              {/* Header with close button */}
              <div className="flex items-center justify-between border-b border-border/50 p-3 relative">
                <h3 className="text-foreground text-sm font-normal">invite users to chat</h3>
                <button 
                  onClick={onClose}
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent/50 transition-colors"
                  disabled={isInviting}
                >
                  <X weight="duotone" className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <AnimatePresence mode="wait">
                  {inviteResults ? (
                    // Show results
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-sm text-foreground mb-4">
                        {inviteResults.length} {inviteResults.length === 1 ? 'invitation' : 'invitations'} sent.
                      </p>
                      
                      <div className="max-h-60 overflow-y-auto mb-4">
                        {inviteResults.map((result, index) => (
                          <motion.div 
                            key={index} 
                            className="flex items-center py-2 border-b border-border/20 last:border-0"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ 
                              duration: 0.2,
                              delay: index * 0.05
                            }}
                          >
                            <div className="h-8 w-8 rounded-full bg-accent/30 flex items-center justify-center mr-3">
                              <Envelope weight="duotone" className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-foreground">{result.email}</p>
                              <p className="text-xs text-muted-foreground">
                                {result.status === 'sent' && 'invitation sent'}
                                {result.status === 'failed' && 'failed to send: ' + (result.error || 'unknown error')}
                                {result.status === 'skipped' && result.message}
                              </p>
                            </div>
                            {result.status === 'sent' && (
                              <Check className="h-5 w-5 text-green-500" weight="duotone" />
                            )}
                          </motion.div>
                        ))}
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          type="button" 
                          variant="default" 
                          size="sm"
                          onClick={onClose}
                          className="text-xs w-24"
                        >
                          close
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    // Show invite form
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-sm text-foreground mb-4">
                        invite users to collaborate on "<span className="font-medium">{chatTitle}</span>".
                      </p>

                      {/* Email input first - moved above permission level */}
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">
                          email addresses
                        </label>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="relative flex-1">
                            <Input
                              ref={inputRef}
                              type="email"
                              value={currentEmail}
                              onChange={handleEmailChange}
                              onKeyDown={handleKeyPress}
                              placeholder="enter email address"
                              className="w-full bg-background border-border/50 text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                              disabled={isInviting}
                            />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={addEmail}
                            disabled={!currentEmail.trim() || isInviting}
                            className="h-9 w-9 p-0 flex items-center justify-center border-border/50 bg-background hover:bg-accent/50"
                          >
                            <Plus weight="duotone" className="h-4 w-4 text-foreground" />
                          </Button>
                        </div>
                        
                        {/* Error message */}
                        <AnimatePresence>
                          {error && (
                            <motion.p 
                              className="text-xs text-red-500 mb-3"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              {error}
                            </motion.p>
                          )}
                        </AnimatePresence>
                        
                        {/* Email list with fixed height */}
                        <div className="mb-4 h-14 border border-border/30 rounded-md bg-accent/10 overflow-hidden">
                          {emails.length > 0 ? (
                            <div 
                              ref={emailsContainerRef}
                              className="flex overflow-x-auto h-full py-2 px-2 gap-2 no-scrollbar"
                              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                              <AnimatePresence>
                                {emails.map((email, index) => (
                                  <motion.div 
                                    key={email} 
                                    className="flex items-center justify-between p-2 bg-accent/20 rounded-md flex-shrink-0 border border-border/50 group"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="h-6 w-6 rounded-full bg-accent/30 flex items-center justify-center">
                                        <UserPlus weight="duotone" className="h-3 w-3 text-muted-foreground" />
                                      </div>
                                      <span className="text-sm text-foreground max-w-[140px] truncate">
                                        {email}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeEmail(index)}
                                      disabled={isInviting}
                                      className="ml-2 text-muted-foreground hover:text-foreground transition-colors opacity-70 group-hover:opacity-100"
                                    >
                                      <X weight="duotone" className="h-4 w-4" />
                                    </button>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <p className="text-xs text-muted-foreground italic">
                                add email addresses to invite users
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Permission level selector - now below email input */}
                      <div className="mb-6">
                        <label className="text-xs text-muted-foreground mb-2 block">
                          permission level
                        </label>
                        <div className="space-y-2">
                          {permissionOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setSelectedRole(option.value)}
                              className={cn(
                                "w-full flex items-center gap-3 p-2 rounded-md border transition-colors duration-200",
                                "hover:bg-accent/40 focus:outline-none focus:ring-0",
                                selectedRole === option.value 
                                  ? "bg-accent/30 border-border" 
                                  : "bg-background/60 border-border/40 hover:border-border/80"
                              )}
                            >
                              <div className="h-6 w-6 rounded-full bg-accent/30 flex-shrink-0 flex items-center justify-center">
                                {option.icon}
                              </div>
                              <div className="flex-1 text-left">
                                <div className="text-sm font-medium text-foreground flex items-center">
                                  {option.label}
                                  {selectedRole === option.value && (
                                    <Check className="h-3.5 w-3.5 ml-1.5 text-foreground" weight="duotone" />
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {option.description}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Button row */}
                      <div className="flex justify-end gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={onClose}
                          disabled={isInviting}
                          className="text-xs w-24 text-foreground border-border/50"
                        >
                          cancel
                        </Button>
                        <Button 
                          type="button" 
                          variant="default" 
                          size="sm"
                          onClick={sendInvites}
                          disabled={emails.length === 0 || isInviting}
                          className="text-xs w-24"
                        >
                          {isInviting ? (
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                              <span>sending...</span>
                            </div>
                          ) : (
                            <span>send</span>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 