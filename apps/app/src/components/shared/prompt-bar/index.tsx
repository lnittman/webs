"use client";

import React, { useRef, useState, useCallback } from "react";
import { cn, debounce } from "@/src/lib/utils";
import { Textarea } from "@repo/design/components/ui/textarea";
import { useIsMobile } from "@repo/design/hooks/use-mobile";
import { useAtom } from "jotai";
import { commandInputAtom } from "@/src/store/ui/input";
import { PlusMenu } from "./components/plus-menu";
import { SendButton } from "./components/SendButton";

interface PromptBarProps {
  input?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit?: (event?: { preventDefault?: () => void }) => void;
  isLoading?: boolean;
  stop?: () => void;
  onCommand?: (command: string) => void; // For backward compatibility
}

export function PromptBar({ 
  input: propInput, 
  onChange: propOnChange, 
  onSubmit: propOnSubmit, 
  isLoading = false, 
  stop,
  onCommand
}: PromptBarProps) {
  const isMobile = useIsMobile();
  
  // Support both prop-based input and jotai store
  const [storeInput, setStoreInput] = useAtom(commandInputAtom);
  const input = propInput !== undefined ? propInput : storeInput;
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input change (support both prop-based and store-based)
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    if (propOnChange) {
      propOnChange(e);
    } else {
      setStoreInput(value);
    }
  };
  
  // Focus the input and maintain active state
  const focusInput = () => {
    setIsFocused(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Use debounced submit to prevent rapid multiple submissions
  const debouncedSubmit = useCallback(debounce(() => {
    // Only allow submission if we aren't already submitting and have input text
    if (!isSubmitting && input?.trim()) {
      // Mark as submitting to prevent double-submissions
      setIsSubmitting(true);
      
      console.log(`[CommandBar] Submitting command: ${input.substring(0, 30)}${input.length > 30 ? '...' : ''}`);
      
      // Call the handler in order of priority
      if (propOnSubmit) {
        propOnSubmit();
      } else if (onCommand) {
        onCommand(input);
        setStoreInput(''); // Clear input after submission
      }
      
      // Reset submission state after a short delay to prevent rapid re-submissions
      setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
  }, 100), [isSubmitting, propOnSubmit, onCommand, input, setStoreInput]);

  const handleSubmit = () => {
    if (input?.trim() && !isLoading && !isSubmitting) {
      // Use debounced submission
      debouncedSubmit();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
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
    } 
  };

  // Classes for the container that change based on focus state
  const containerClasses = cn(
    "rounded-2xl border transition-all duration-200 relative z-30 w-full bg-muted/40 max-w-2xl",
    isFocused 
      ? "border-primary/10" 
      : "border-border/40 hover:border-border/60"
  );

  // Safely access input for rows calculation
  const inputLines = input?.split('\n') || [''];
  const rows = inputLines.length > 3 ? 3 : inputLines.length;

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
          value={input || ''}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={isLoading || isSubmitting}
          rows={rows}
        />
      </div>
      
      {/* Control Row */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border/20">
        <div className="flex items-center gap-2">
          <PlusMenu disabled={isLoading || isSubmitting} />
        </div>
        
        <div className="flex items-center gap-2">
          <SendButton 
            isLoading={isLoading}
            isSubmitting={isSubmitting}
            hasInput={!!(input?.trim())}
            onSubmit={handleSubmit}
            onStop={stop}
          />
        </div>
      </div>
    </div>
  );
} 