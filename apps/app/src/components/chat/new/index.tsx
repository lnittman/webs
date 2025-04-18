import React, { useCallback, useEffect, useState } from "react";

import { cn } from "@/src/lib/utils";

import { Greeting } from "./components/Greeting";
import { PromptBar } from "../../shared/prompt-bar";
import { useChatNavigation } from "@/src/store/data/chat";

interface NewChatProps {
  isTransitioning?: boolean;
  userName?: string | null;
  onCommand?: (command: string) => void;
}

export function NewChat({ 
  isTransitioning: propTransitioning = true,
  userName, 
  onCommand,
}: NewChatProps) {
  const { createAndNavigate } = useChatNavigation();

  const [isTransitioning, setIsTransitioning] = useState(true);

  useEffect(() => {
    // Set initial transitioning state from props
    setIsTransitioning(propTransitioning);
    
    // Start fade-in animation after component mounts
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [propTransitioning]);

  // Handle command from the NewChat component
  const handleCommand = useCallback(async (command: string) => {
    if (!command.trim()) return;
    
    // Create a new chat with the command as the first message
    // This will create the chat in the database and navigate to it
    console.log('[Home] Creating new chat with initial message:', command.substring(0, 30));
    
    // Use createAndNavigate to ensure server persistence
    const chatTitle = command.substring(0, 30) + (command.length > 30 ? '...' : '');

    try {
      await createAndNavigate(chatTitle, command);
    } catch (error) {
      console.error('[Home] Error creating chat:', error);
    }
  }, [createAndNavigate]);
  
  
  return (
    <div className={cn(
      "flex flex-col items-center w-full h-full transition-opacity duration-500 ease-in-out",
      isTransitioning ? "opacity-0" : "opacity-100"
    )}>
      {/* Greeting */}
      <div className="w-full text-center mt-[20vh] mb-8">
        <Greeting userName={userName} />
      </div>
      
      {/* Command Bar */}
      <div className="w-full max-w-2xl px-4">
        <PromptBar onCommand={handleCommand} />
      </div>
    </div>
  );
} 

