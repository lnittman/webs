"use client";

import React from "react";
import { motion } from "framer-motion";
import { PresetSuggestion } from "./preset-suggestion";
import { PresetTile } from "./preset-tile";
import { getCommandByName, getIconForCommand, getSuggestionsForCommand, usePresetStore } from "@/lib/store/presetStore";
import { useMediaQuery } from "@repo/design/hooks/use-media-query";

interface PresetSuggestionListProps {
  onSuggestionSelect?: (command: string, suggestion: string) => void;
}

export function PresetSuggestionList({ onSuggestionSelect }: PresetSuggestionListProps) {
  const { 
    commands, 
    selectedCommand, 
    selectedSuggestion,
    selectCommand, 
    selectSuggestion,
    setAnimating
  } = usePresetStore();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  // Get the selected command object
  const commandObj = getCommandByName(selectedCommand, commands);
  
  // Get suggestions for the selected command
  const suggestions = getSuggestionsForCommand(selectedCommand, commands);
  
  const handleCommandClick = () => {
    console.log("PresetSuggestionList: handleCommandClick, unselecting command");
    // Unselect the command when clicking on the selected command button
    selectCommand(null);
  };
  
  const handleSuggestionSelect = (suggestion: string) => {
    console.log("PresetSuggestionList: handleSuggestionSelect", { suggestion });
    // Mark that a suggestion was selected
    selectSuggestion(suggestion);
    
    // Allow animation to play before actually sending the command
    setTimeout(() => {
      if (selectedCommand) {
        console.log("PresetSuggestionList: calling onSuggestionSelect");
        
        // Call the parent handler if provided
        if (onSuggestionSelect) {
          onSuggestionSelect(selectedCommand, suggestion);
        } else {
          // Otherwise use the default behavior
          const inputElement = document.getElementById('command-input');
          if (inputElement) {
            const inputField = inputElement as HTMLTextAreaElement;
            // Format the command with the prefix and suggestion
            const fullCommand = `/${selectedCommand} ${suggestion}`;
            inputField.value = fullCommand;
            
            // Dispatch an input event to sync the state
            const event = new Event('input', { bubbles: true });
            inputField.dispatchEvent(event);
            
            // Focus the input and position the cursor at the end
            inputField.focus();
            const length = inputField.value.length;
            inputField.setSelectionRange(length, length);
          }
        }
      }
      
      // Reset suggestion only, but keep command selected for visualization
      selectSuggestion(null);
      // Don't automatically reset command, let the user dismiss it by clicking
      
    }, 150);
  };
  
  const handleAnimationComplete = () => {
    console.log("PresetSuggestionList: animation completed, setting isAnimating to false");
    setAnimating(false);
  };
  
  return (
    <motion.div 
      key="suggestions"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={isDesktop ? 'py-1' : ''}
    >
      <div className="flex items-start">
        <motion.div className="flex-shrink-0">
          {commandObj && (
            <motion.button
              onClick={handleCommandClick}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-primary/30 bg-primary/10 text-foreground hover:bg-primary/15 hover:transition-colors hover:duration-200"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 25,
                duration: 0.3
              }}
              onAnimationComplete={handleAnimationComplete}
            >
              <span>
                {getIconForCommand(commandObj.iconType)}
              </span>
              <span>{commandObj.name}</span>
            </motion.button>
          )}
        </motion.div>
        
        <div className={`flex-1 ml-3 ${isDesktop ? '' : 'overflow-x-auto hide-scrollbar'}`}>
          <div className={`${isDesktop ? 'grid grid-cols-2 gap-2' : 'flex gap-2'}`}>
            {suggestions.map((suggestion, index) => (
              <PresetSuggestion
                key={index}
                suggestion={suggestion}
                isSelected={selectedSuggestion === suggestion}
                index={index}
                onClick={() => handleSuggestionSelect(suggestion)}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
} 