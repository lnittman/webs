"use client";

import React from "react";
import { motion } from "framer-motion";
import { usePresetStore, getIconForCommand } from "@/lib/store/presetStore";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@repo/design/hooks/use-media-query";
import { useAtom } from "jotai";
import { commandInputAtom } from "@/lib/store/settingsStore";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent
} from "@repo/design/components/ui/collapsible";
import { Button } from "@repo/design/components/ui/button";
import { CaretDown } from "@phosphor-icons/react";

interface PresetMenuGridProps {
  onSuggestionSelect?: (fullCommand: string) => void;
}

export function PresetMenuGrid({ onSuggestionSelect }: PresetMenuGridProps) {
  const { commands } = usePresetStore();
  const [_, setInput] = useAtom(commandInputAtom);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isOpen, setIsOpen] = React.useState(true);
  
  const handleCommandClick = (command: string) => {
    // Select a random suggestion for this command
    const commandObj = commands.find(cmd => cmd.name === command);
    if (commandObj && commandObj.suggestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * commandObj.suggestions.length);
      const suggestion = commandObj.suggestions[randomIndex];
      const fullCommand = `/${command} ${suggestion}`;
      
      // Call the parent component's handler if provided
      if (onSuggestionSelect) {
        onSuggestionSelect(fullCommand);
      } else {
        // Default behavior - update input directly
        setInput(fullCommand);
      }
    }
  };
  
  return (
    <Collapsible 
      defaultOpen 
      open={isOpen} 
      onOpenChange={setIsOpen} 
      className="w-full max-w-3xl mx-auto mt-4 mb-6"
    >
      <div className="flex items-center justify-between px-2 mb-2 group cursor-pointer">
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-foreground hover:text-primary hover:bg-transparent px-0 w-full flex justify-between"
          >
            <h3 className="text-sm font-medium">suggestions</h3>
            <CaretDown 
              weight="duotone" 
              className={cn(
                "h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform duration-200",
                isOpen ? "rotate-180" : "rotate-0"
              )} 
            />
          </Button>
        </CollapsibleTrigger>
      </div>
      
      <CollapsibleContent>
        <div className="px-2">
          <motion.div 
            className="bg-background rounded-xl border-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`grid ${isDesktop ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
              {commands.map((command) => (
                <CommandTile
                  key={command.name}
                  name={command.name}
                  iconType={command.iconType}
                  description={command.description}
                  onClick={() => handleCommandClick(command.name)}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

interface CommandTileProps {
  name: string;
  iconType: string;
  description: string;
  onClick: () => void;
}

function CommandTile({ name, iconType, description, onClick }: CommandTileProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 p-3 rounded-xl border border-input",
        "hover:bg-muted/50 hover:border-input/80 transition-all hover:duration-200"
      )}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-primary">
          {getIconForCommand(iconType)}
        </span>
        <span className="font-medium text-sm">/{name}</span>
      </div>
      <p className="text-xs text-muted-foreground text-left">
        {description}
      </p>
    </motion.button>
  );
}
