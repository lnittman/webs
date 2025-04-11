"use client";

import React, { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { PresetCommandList } from "./components/preset-command-list";
import { PresetSuggestionList } from "./components/preset-suggestion-list";
import { usePresetStore } from "@/lib/store/presetStore";
import { useAtom } from "jotai";
import { commandInputAtom } from "@/lib/store/settingsStore";
import { useMediaQuery } from "@repo/design/hooks/use-media-query";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent
} from "@repo/design/components/ui/collapsible";
import { Button } from "@repo/design/components/ui/button";

// CSS for hiding scrollbars
const scrollbarStyles = `
.hide-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;  /* Chrome, Safari, Opera */
}
`;

// Add the styles to the document head if in browser environment
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = scrollbarStyles;
  document.head.appendChild(styleElement);
}

interface PresetMenuProps {
  onSuggestionSelect?: (fullCommand: string) => void;
}

export function PresetMenu({ onSuggestionSelect }: PresetMenuProps) {
  const { selectedCommand } = usePresetStore();
  const [input, setInput] = useAtom(commandInputAtom);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  // Debug when selectedCommand changes
  useEffect(() => {
    console.log("PresetMenu: selectedCommand changed to", selectedCommand);
  }, [selectedCommand]);
  
  // Sync input with command selection, but ONLY for user typing
  // Don't overwrite explicit command selections from clicking
  useEffect(() => {
    // Skip this effect when selectedCommand is already set - let click handlers manage it
    if (selectedCommand !== null) {
      console.log("PresetMenu: selectedCommand already set, skipping input sync");
      return;
    }
    
    console.log("PresetMenu: checking input for command:", input);
    
    if (input.startsWith('/')) {
      const parts = input.trim().split(' ');
      const commandName = parts[0].substring(1); // Remove the leading slash
      
      // Find if the command exists in our preset store
      const commandExists = usePresetStore.getState().commands.some(
        cmd => cmd.name === commandName
      );
      
      console.log("PresetMenu: input contains command:", commandName, "exists:", commandExists);
      
      // Only update the selected command if this is a valid command and no text after it
      if (commandExists && parts.length === 1) {
        console.log("PresetMenu: setting selectedCommand from input:", commandName);
        usePresetStore.getState().selectCommand(commandName);
      }
    }
  }, [input, selectedCommand]);
  
  // Custom handler for when suggestions are selected in PresetSuggestionList
  const handleSuggestionSelect = (command: string, suggestion: string) => {
    const fullCommand = `/${command} ${suggestion}`;
    console.log("PresetMenu: suggestion selected", { command, suggestion, fullCommand });
    
    // Call the parent component's handler if provided
    if (onSuggestionSelect) {
      onSuggestionSelect(fullCommand);
    } else {
      // Default behavior if no handler provided - update input directly
      setInput(fullCommand);
    }
  };

  // Mobile view - no collapsible
  return (
    <div className="w-full max-w-3xl mx-auto px-4 mb-3">
      <AnimatePresence mode="wait">
        {!selectedCommand ? (
          <PresetCommandList />
        ) : (
          <PresetSuggestionList onSuggestionSelect={handleSuggestionSelect} />
        )}
      </AnimatePresence>
    </div>
  );
} 