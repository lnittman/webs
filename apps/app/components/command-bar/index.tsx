"use client";

import { useAtom } from "jotai";
import { usePathname } from "next/navigation";
import React, { useRef, useEffect, useState, useCallback } from "react";

import { 
  ArrowUp, 
  SpinnerGap,
} from "@phosphor-icons/react";

import { useSidebar } from "@/components/layout/sidebar/SidebarProvider";
import { commandInputAtom, commandHistoryAtom, historyIndexAtom } from "@/lib/store/settingsStore";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/useChat";

import { Button } from "@repo/design/components/ui/button";
import { Textarea } from "@repo/design/components/ui/textarea";
import { useIsMobile } from "@repo/design/hooks/use-mobile";

import { CommandMenu } from "./components/plus-menu";

// Debounce helper function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      timeout = null;
      func(...args);
    }, wait);
  } as T;
}

export function CommandBar() {
  const { isLoading, handleCommand } = useChat();
  
  const [input, setInput] = useAtom(commandInputAtom);
  const [commandHistory] = useAtom(commandHistoryAtom);
  const [historyIndex, setHistoryIndex] = useAtom(historyIndexAtom);
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOpen: isSidebarOpen } = useSidebar();
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const pathname = usePathname();
  
  // Reset history index when component unmounts
  useEffect(() => {
    return () => setHistoryIndex(-1);
  }, [setHistoryIndex]);

  // Effect to handle command activation when user types a slash
  useEffect(() => {
    if (input.startsWith('/') && inputRef.current) {
      // This means a command was just activated
      inputRef.current.focus();
    }
  }, [input]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
  };

  // Focus the input and maintain active state
  const focusInput = () => {
    setIsFocused(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Use debounced submit to prevent rapid multiple submissions
  const debouncedSubmit = useCallback(debounce((inputVal: string) => {
    // Only allow submission if we aren't already submitting and have input text
    if (!isSubmitting && inputVal.trim()) {
      // Mark as submitting to prevent double-submissions
      setIsSubmitting(true);
      
      console.log(`[CommandBar] Submitting command: ${inputVal.substring(0, 30)}${inputVal.length > 30 ? '...' : ''}`);
      
      // Call the handler
      if (typeof handleCommand === 'function') {
        handleCommand(inputVal);
      } else {
        console.error("[CommandBar] handleCommand is not a function");
      }
      
      // Reset input and history index
      setInput("");
      setHistoryIndex(-1);
      
      // Reset submission state after a short delay to prevent rapid re-submissions
      setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
  }, 100), [handleCommand, setInput, setHistoryIndex, isSubmitting]);

  const handleSubmit = () => {
    if (input.trim() && !isLoading && !isSubmitting) {
      // Use debounced submission - no mode parameter
      debouncedSubmit(input);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle up/down arrow for command history
    if (e.key === 'ArrowUp' && commandHistory.length > 0 && !e.shiftKey) {
      e.preventDefault();
      const newIndex = historyIndex === -1 ? 0 : Math.min(historyIndex + 1, commandHistory.length - 1);
      setHistoryIndex(newIndex);
      setInput(commandHistory[newIndex]);
    } else if (e.key === 'ArrowDown' && historyIndex > -1 && !e.shiftKey) {
      e.preventDefault();
      if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'Enter') {
      // On mobile, always just insert a newline
      if (isMobile) {
        // Do nothing, let the default behavior happen (newline)
        return;
      }
      
      // On desktop, submit on Enter unless Shift is pressed
      if (!e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    } else if (e.key === 'Tab' && input.startsWith('/') && !input.includes(' ')) {
      // If user presses Tab after typing a command prefix, prevent the default behavior
      // CommandMenu will handle the selection
      e.preventDefault();
    }
  };

  // Classes for the container that change based on focus state
  const containerClasses = cn(
    "rounded-2xl border transition-all duration-200 relative z-30 w-full bg-muted/40 max-w-2xl",
    isFocused 
      ? "border-primary/10" 
      : "border-border/40 hover:border-border/60"
  );

  return (
    <div 
      ref={containerRef}
      onClick={focusInput}
      className={containerClasses}
    >
      <div className="relative flex items-center p-2">
        <Textarea
          ref={inputRef}
          id="command-input"
          className="resize-none min-h-[40px] pl-3 pr-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none text-foreground placeholder:text-muted-foreground"
          placeholder="what do you want to know?"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={isLoading || isSubmitting}
          rows={input.split('\n').length > 3 ? 3 : input.split('\n').length || 1}
        />
      </div>
      
      {/* Control Row */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border/20">
        <div className="flex items-center gap-2">
          <CommandMenu disabled={isLoading || isSubmitting} />
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            type="button" 
            size="icon" 
            variant="ghost"
            className={`h-8 w-8 rounded-full flex items-center justify-center ${
              input.trim() && !isLoading && !isSubmitting
                ? "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200" 
                : "bg-muted/60 text-muted-foreground hover:bg-muted/80 transition-colors duration-200"
            }`}
            onClick={handleSubmit}
            disabled={isLoading || isSubmitting || !input.trim()}
          >
            {isLoading || isSubmitting ? (
              <SpinnerGap weight="bold" className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp weight="bold" className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 