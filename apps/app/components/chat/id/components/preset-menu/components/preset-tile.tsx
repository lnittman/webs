"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getIconForCommand } from "@/lib/store/presetStore";

interface PresetTileProps {
  name: string;
  iconType: string;
  isSelected: boolean;
  onClick: () => void;
}

export function PresetTile({ 
  name, 
  iconType, 
  isSelected, 
  onClick 
}: PresetTileProps) {
  return (
    <motion.button
      key={name}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border",
        isSelected 
          ? "bg-primary/10 text-foreground border-primary/30 hover:bg-primary/15" 
          : "bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground border-input hover:border-input/80 hover:transition-all hover:duration-200"
      )}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <span className={cn(
        isSelected 
          ? "text-foreground" 
          : "text-muted-foreground group-hover:text-foreground group-hover:transition-colors group-hover:duration-200"
      )}>
        {getIconForCommand(iconType)}
      </span>
      <span>{name}</span>
    </motion.button>
  );
} 