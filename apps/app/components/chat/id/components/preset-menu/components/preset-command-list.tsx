"use client";

import React from "react";
import { motion } from "framer-motion";
import { PresetTile } from "./preset-tile";
import { usePresetStore } from "@/lib/store/presetStore";
import { useMediaQuery } from "@repo/design/hooks/use-media-query";

export function PresetCommandList() {
  const { commands, selectedCommand, selectCommand, setAnimating } = usePresetStore();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  const handleCommandSelect = (command: string) => {
    console.log("PresetCommandList: handleCommandSelect", { command, currentSelected: selectedCommand });
    
    // If already selected, unselect it
    if (selectedCommand === command) {
      console.log("PresetCommandList: unselecting command");
      selectCommand(null);
      return;
    }
    
    // Mark animation as in progress and select the command immediately
    console.log("PresetCommandList: selecting new command and setting animation");
    setAnimating(true);
    selectCommand(command);
  };
  
  return (
    <motion.div 
      key="commands"
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2 }}
      className="bg-background rounded-xl border-0"
    >
      <div className={`flex flex-wrap ${isDesktop ? 'justify-start gap-3' : 'justify-center gap-2'}`}>
        {commands.map((command) => (
          <PresetTile
            key={command.name}
            name={command.name}
            iconType={command.iconType}
            isSelected={selectedCommand === command.name}
            onClick={() => handleCommandSelect(command.name)}
          />
        ))}
      </div>
    </motion.div>
  );
} 