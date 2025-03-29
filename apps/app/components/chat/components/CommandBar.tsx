"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { 
  ArrowUp, 
  Spiral, 
  Person, 
  SpinnerGap,
  Plus
} from "@phosphor-icons/react";

import { Button } from "@repo/design/components/ui/button";
import { Textarea } from "@repo/design/components/ui/textarea";
import { useAtom } from "jotai";
import { commandInputAtom, commandHistoryAtom, historyIndexAtom } from "@/lib/store/settingsStore";
import { useIsMobile } from "@repo/design/hooks/use-mobile";

interface CommandBarProps {
  onCommand: (command: string, options?: { mode?: 'main' | 'spin' | 'think' }) => void;
  isLoading?: boolean;
}

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

export function CommandBar({ onCommand, isLoading = false }: CommandBarProps) {
  const [input, setInput] = useAtom(commandInputAtom);
  const [commandHistory] = useAtom(commandHistoryAtom);
  const [historyIndex, setHistoryIndex] = useAtom(historyIndexAtom);
  const [spinActive, setSpinActive] = useState(false);
  const [thinkActive, setThinkActive] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

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

  const handleCommandSelect = (command: string) => {
    setInput(`/${command} `);
    
    // Focus the input after selecting a command
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        // Place cursor at the end of the input
        const length = `/${command} `.length;
        inputRef.current.setSelectionRange(length, length);
      }
    }, 0);
  };

  // Use debounced submit to prevent rapid multiple submissions
  const debouncedSubmit = useCallback(debounce((inputVal: string, mode: 'main' | 'spin' | 'think') => {
    // Only allow submission if we aren't already submitting and have input text
    if (!isSubmitting && inputVal.trim()) {
      // Mark as submitting to prevent double-submissions
      setIsSubmitting(true);
      
      console.log(`[CommandBar] Submitting command: ${inputVal.substring(0, 30)}${inputVal.length > 30 ? '...' : ''}`);
      
      // Call the onCommand callback
      onCommand(inputVal, { mode });
      
      // Reset input and history index
      setInput("");
      setHistoryIndex(-1);
      
      // Reset submission state after a short delay to prevent rapid re-submissions
      setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
  }, 100), [onCommand, setInput, setHistoryIndex, isSubmitting]);

  const handleSubmit = () => {
    if (input.trim() && !isLoading && !isSubmitting) {
      // Determine which mode to use based on button states
      let mode: 'main' | 'spin' | 'think' = 'main';
      if (spinActive) mode = 'spin';
      if (thinkActive) mode = 'think';
      
      // Use debounced submission
      debouncedSubmit(input, mode);
      
      // Reset modes immediately for UI feedback
      setSpinActive(false);
      setThinkActive(false);
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

  const toggleSpin = () => {
    if (thinkActive) setThinkActive(false); // Turn off think if spin is activated
    setSpinActive(prev => !prev);
    focusInput(); // Keep the input focused when toggling
  };

  const toggleThink = () => {
    if (spinActive) setSpinActive(false); // Turn off spin if think is activated
    setThinkActive(prev => !prev);
    focusInput(); // Keep the input focused when toggling
  };

  // Classes for the container that change based on focus state
  const containerClasses = `rounded-2xl ${
    isFocused 
      ? "border-primary/10 bg-muted/50 shadow-[0_0_0_1px_rgba(var(--primary),0.1)]" 
      : "border-input/50 bg-muted/30 hover:bg-muted/50 hover:border-input/80"
  } border shadow-sm transition-all duration-200 relative z-30`;

  return (
    <div className="w-full max-w-3xl mx-auto px-2 mb-2">
      <div 
        ref={containerRef}
        onClick={focusInput}
        className={containerClasses}
      >
        <div className="relative flex items-center p-2">
          <Textarea
            ref={inputRef}
            id="command-input"
            className="resize-none min-h-[40px] pl-3 pr-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none text-foreground placeholder:text-muted-foreground/70"
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
            <Button 
              type="button" 
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full bg-muted/40 border-input/40 text-muted-foreground hover:text-foreground flex items-center justify-center hover:bg-muted hover:border-input transition-colors duration-200"
              disabled={isLoading || isSubmitting}
              onClick={() => focusInput()}
            >
              <Plus weight="duotone" className="h-4 w-4" />
            </Button>
            
            <Button 
              type="button" 
              variant={spinActive ? "secondary" : "ghost"}
              size="sm"
              className={`h-8 rounded-full border text-xs ${
                spinActive 
                  ? "border-primary/20 bg-primary/10 text-foreground font-medium" 
                  : "border-input/40 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted hover:border-input/60 transition-all duration-200"
              } flex items-center gap-1.5 px-3`}
              onClick={toggleSpin}
              disabled={isLoading || isSubmitting}
            >
              <Spiral weight="duotone" className="h-4 w-4" />
              <span>spin</span>
            </Button>
            
            <Button 
              type="button" 
              variant={thinkActive ? "secondary" : "ghost"}
              size="sm"
              className={`h-8 rounded-full text-xs border ${
                thinkActive 
                  ? "border-primary/20 bg-primary/10 text-foreground font-medium" 
                  : "border-input/40 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted hover:border-input/60 transition-all duration-200"
              } flex items-center gap-1.5 px-3`}
              onClick={toggleThink}
              disabled={isLoading || isSubmitting}
            >
              <Person weight="duotone" className="h-4 w-4" />
              <span>think</span>
            </Button>
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
    </div>
  );
} 