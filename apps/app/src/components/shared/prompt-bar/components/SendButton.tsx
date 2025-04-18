"use client";

import React from "react";
import { ArrowUp, SpinnerGap, Stop } from "@phosphor-icons/react";
import { Button } from "@repo/design/components/ui/button";

interface SendButtonProps {
  isLoading: boolean;
  isSubmitting: boolean;
  hasInput: boolean;
  onSubmit: () => void;
  onStop?: () => void;
}

export function SendButton({
  isLoading,
  isSubmitting,
  hasInput,
  onSubmit,
  onStop
}: SendButtonProps) {
  // If we're loading and have a stop function, show stop button
  if (isLoading && onStop) {
    return (
      <Button 
        type="button" 
        size="icon" 
        variant="ghost"
        className="h-8 w-8 rounded-lg flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200"
        onClick={onStop}
        aria-label="Stop generating"
      >
        <Stop weight="bold" className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button 
      type="button" 
      size="icon" 
      variant="ghost"
      className={`h-8 w-8 rounded-lg flex items-center justify-center ${
        hasInput && !isLoading && !isSubmitting
          ? "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200" 
          : "bg-muted/60 text-muted-foreground hover:bg-muted/80 transition-colors duration-200"
      }`}
      onClick={onSubmit}
      disabled={isLoading || isSubmitting || !hasInput}
    >
      {isLoading || isSubmitting ? (
        <SpinnerGap weight="bold" className="h-4 w-4 animate-spin" />
      ) : (
        <ArrowUp weight="bold" className="h-4 w-4" />
      )}
    </Button>
  );
}
