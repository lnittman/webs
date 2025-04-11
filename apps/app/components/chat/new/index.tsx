import React, { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { Greeting } from "./components/Greeting";
import { CommandBar } from "../../command-bar";

interface NewChatProps {
  isLoading?: boolean;
  isTransitioning?: boolean;
  userName?: string | null;
  onCommand?: (command: string) => void;
}

export function NewChat({ 
  isLoading = false,
  isTransitioning: propTransitioning = true,
  userName, 
  onCommand = (command: string) => {
    console.warn("No onCommand handler provided to NewChat. Command:", command);
  },
}: NewChatProps) {
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
  
  return (
    <div className={cn(
      "flex flex-col items-center w-full h-full transition-opacity duration-500 ease-in-out",
      isTransitioning ? "opacity-0" : "opacity-100"
    )}>
      {/* Greeting */}
      <div className="w-full text-center mt-[25vh] mb-8">
        <Greeting userName={userName} />
      </div>
      
      {/* Command Bar */}
      <div className="w-full max-w-2xl px-4">
        <CommandBar />
      </div>
    </div>
  );
} 

