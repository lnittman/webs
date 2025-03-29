"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PresetSuggestionProps {
  suggestion: string;
  isSelected: boolean;
  index: number;
  onClick: () => void;
}

export function PresetSuggestion({ 
  suggestion, 
  isSelected, 
  index, 
  onClick 
}: PresetSuggestionProps) {
  return (
    <motion.button
      key={suggestion}
      onClick={onClick}
      className={cn(
        "whitespace-nowrap flex-shrink-0 px-3 py-2 text-xs font-medium rounded-xl border",
        isSelected 
          ? "bg-primary/10 border-primary/30 text-foreground" 
          : "bg-background hover:bg-muted/50 border-input hover:border-input/80 text-muted-foreground hover:text-foreground hover:transition-all hover:duration-200"
      )}
      initial={{ opacity: 0, x: 20, y: 5 }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        y: 0,
      }}
      exit={{ opacity: 0, x: -10, y: 5 }}
      transition={{ 
        type: "spring",
        stiffness: 400, 
        damping: 25,
        delay: 0.05 * (index + 1),
        duration: 0.2
      }}
    >
      {suggestion}
    </motion.button>
  );
} 