import { create } from 'zustand';
import React from 'react';
import { 
  Globe, 
  FileText, 
  ChatTeardropDots, 
  MagnifyingGlass, 
  Question, 
  Code,
  IconProps
} from "@phosphor-icons/react";

// Type definitions
export interface PresetCommand {
  name: string;
  // Use string for icon to avoid JSX in the store state
  iconType: 'globe' | 'file' | 'chat' | 'search' | 'question' | 'code';
  description: string;
  suggestions: string[];
}

export interface PresetState {
  // Available commands
  commands: PresetCommand[];
  
  // UI State
  selectedCommand: string | null;
  selectedSuggestion: string | null;
  isAnimating: boolean;
  
  // Actions
  selectCommand: (command: string | null) => void;
  selectSuggestion: (suggestion: string | null) => void;
  setAnimating: (isAnimating: boolean) => void;
  resetState: () => void;
}

export const usePresetStore = create<PresetState>((set, get) => ({
  // Available commands with their suggestions
  commands: [
    {
      name: "url",
      iconType: "globe",
      description: "Fetch a web page",
      suggestions: [
        "arxiv.org/archive/cs",
        "github.com/trending",
        "news.ycombinator.com"
      ]
    },
    {
      name: "summary",
      iconType: "file",
      description: "Summarize content",
      suggestions: [
        "blog post summary",
        "research paper highlights",
        "news article tldr"
      ]
    },
    {
      name: "chat",
      iconType: "chat",
      description: "Ask a question",
      suggestions: [
        "explain this content",
        "what are the key points?",
        "how does this work?"
      ]
    },
    {
      name: "search",
      iconType: "search",
      description: "Search for information",
      suggestions: [
        "machine learning",
        "web development",
        "latest research"
      ]
    },
    {
      name: "help",
      iconType: "question",
      description: "Get help",
      suggestions: [
        "available commands",
        "how to use webs",
        "keyboard shortcuts"
      ]
    },
    {
      name: "code",
      iconType: "code",
      description: "Code examples",
      suggestions: [
        "JavaScript example",
        "Python snippet",
        "React component"
      ]
    },
  ],
  
  // UI State
  selectedCommand: null,
  selectedSuggestion: null,
  isAnimating: false,
  
  // Actions
  selectCommand: (command) => {
    console.log("PresetStore: selectCommand", { 
      command, 
      previousCommand: get().selectedCommand,
      isAnimating: get().isAnimating
    });
    
    // Prevent identical updates that might trigger React re-renders
    if (get().selectedCommand === command) {
      console.log("PresetStore: skipping identical command selection");
      return;
    }
    
    set({ selectedCommand: command, selectedSuggestion: null });
  },
  
  selectSuggestion: (suggestion) => {
    console.log("PresetStore: selectSuggestion", { 
      suggestion, 
      previousSuggestion: get().selectedSuggestion,
      isAnimating: get().isAnimating
    });
    
    // Prevent identical updates
    if (get().selectedSuggestion === suggestion) {
      console.log("PresetStore: skipping identical suggestion selection");
      return;
    }
    
    set({ selectedSuggestion: suggestion });
  },
  
  setAnimating: (isAnimating) => {
    console.log("PresetStore: setAnimating", { 
      isAnimating, 
      previousAnimating: get().isAnimating,
      selectedCommand: get().selectedCommand
    });
    
    // Prevent identical updates
    if (get().isAnimating === isAnimating) {
      console.log("PresetStore: skipping identical animating state");
      return;
    }
    
    set({ isAnimating });
  },
  
  resetState: () => {
    console.log("PresetStore: resetState");
    set({ selectedCommand: null, selectedSuggestion: null, isAnimating: false });
  },
}));

// Helper function to render icon component based on type
export function getIconForCommand(iconType: string): React.ReactElement {
  const iconProps: IconProps = { 
    weight: "duotone", 
    className: "h-4 w-4" 
  };
  
  switch(iconType) {
    case 'globe':
      return <Globe {...iconProps} />;
    case 'file':
      return <FileText {...iconProps} />;
    case 'chat':
      return <ChatTeardropDots {...iconProps} />;
    case 'search':
      return <MagnifyingGlass {...iconProps} />;
    case 'question':
      return <Question {...iconProps} />;
    case 'code':
      return <Code {...iconProps} />;
    default:
      return <Globe {...iconProps} />;
  }
}

// Helper functions
export function getSuggestionsForCommand(commandName: string | null, commands: PresetCommand[]): string[] {
  if (!commandName) return [];
  const command = commands.find(cmd => cmd.name === commandName);
  return command?.suggestions || [];
}

export function getCommandByName(commandName: string | null, commands: PresetCommand[]): PresetCommand | undefined {
  if (!commandName) return undefined;
  return commands.find(cmd => cmd.name === commandName);
} 