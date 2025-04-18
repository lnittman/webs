import React from "react";
import { PencilSimple } from "@phosphor-icons/react";
import { Button } from "@repo/design/components/ui/button";
import { PromptBar } from "@/src/components/shared/prompt-bar";
import { useIsMobile } from "@repo/design/hooks/use-mobile";

import { AddFiles } from "./components/AddFiles";
import { AddInstructions } from "./components/AddInstructions";
import { ChatList } from "./components/ChatList";

interface ProjectViewProps {
  projectId: string;
  projectName: string;
  chats: any[];
  isLoading: boolean;
  messagesRef: React.RefObject<HTMLDivElement>;
  onCommand: (command: string) => void;
}

export function ProjectView({ 
  projectId,
  projectName,
  chats,
  isLoading,
  messagesRef,
  onCommand
}: ProjectViewProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col h-full items-center pb-24">
      {/* Project name */}
      <div className="w-full max-w-3xl px-4 mt-12 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-medium text-foreground">{projectName}</h1>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <PencilSimple weight="duotone" className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Command Bar - Below project name */}
      <div className="w-full max-w-3xl px-4 mb-8">
        <PromptBar onCommand={onCommand} isLoading={isLoading} />
      </div>
      
      {/* Main content area */}
      <div 
        ref={messagesRef}
        className="w-full max-w-3xl px-4 pb-16"
      >
        {/* Interactive Elements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <AddFiles />
          <AddInstructions />
        </div>
        
        {/* Project Chats */}
        <ChatList projectId={projectId} chats={chats} />
      </div>
    </div>
  );
} 