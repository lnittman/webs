"use client";

import React, { useRef, useEffect, useState } from "react";
import { X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@repo/design/components/ui/button";
import { useProjectStore } from "@/lib/store/projectStore";
import { useMediaQuery } from "@repo/design/hooks/use-media-query";
import { Input } from "@repo/design/components/ui/input";
import { Label } from "@repo/design/components/ui/label";
import { useRouter } from "next/navigation";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectModal({ isOpen, onClose }: ProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { createProject } = useProjectStore();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle creating a project
  const handleCreateProject = async () => {
    if (!projectName.trim() || isCreating) return;
    
    try {
      setIsCreating(true);
      const newProject = await createProject(projectName.trim());
      setProjectName("");
      onClose();
      
      // Navigate to the new project page
      if (newProject && newProject.id) {
        router.push(`/p/${newProject.id}`);
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreateProject();
  };

  // Handle backdrop click
  const handleBackdropClick = () => {
    onClose();
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
                <h3 className="text-foreground text-sm font-normal">project name</h3>
                <button 
                  onClick={onClose}
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent/50 transition-colors"
                >
                  <X weight="duotone" className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              
              {/* Form */}
              <form onSubmit={handleSubmit} className="px-3 py-4">
                <div className="mb-6">
                  <Input
                    ref={inputRef}
                    type="text"
                    id="project-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. birthday party planning"
                    className="w-full text-foreground border-input/50 focus:border-input"
                  />
                </div>
                
                {/* Info text */}
                <div className="bg-accent/30 rounded-md p-3 mb-5">
                  <div className="flex items-start gap-2">
                    <div className="text-foreground font-semibold text-xs">what's a project?</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    projects keep chats, files, and custom instructions in one place. use them for ongoing work, or just to keep things tidy.
                  </p>
                </div>
                
                {/* Button row */}
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={onClose}
                    className="text-xs text-foreground"
                  >
                    cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="default" 
                    size="sm"
                    disabled={!projectName.trim() || isCreating}
                    className="text-xs"
                  >
                    {isCreating ? "creating..." : "create project"}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 