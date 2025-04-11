import React, { RefObject } from "react";
import Link from "next/link";
import { CommandBar } from "@/components/command-bar";
import { ChatItemMenu } from "@/components/layout/ChatItemMenu";
import { PencilSimple, FileArrowUp, ChatCircleText, ChatCircleDots } from "@phosphor-icons/react";
import { Button } from "@repo/design/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useIsMobile } from "@repo/design/hooks/use-mobile";

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
        <CommandBar onCommand={onCommand} isLoading={isLoading} />
      </div>
      
      {/* Main content area */}
      <div 
        ref={messagesRef}
        className="w-full max-w-3xl px-4 pb-16"
      >
        {/* Interactive Elements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {/* Add files */}
          <div className="flex flex-col p-6 rounded-lg border border-border/50 hover:border-border hover:bg-accent/30 transition-colors">
            <div className="flex items-center mb-2">
              <FileArrowUp weight="duotone" className="h-5 w-5 mr-2 text-muted-foreground" />
              <h3 className="text-base font-medium text-foreground">add files</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              upload files to provide context for your project chats.
            </p>
            <Button className="w-full">upload files</Button>
          </div>
          
          {/* Add instructions */}
          <div className="flex flex-col p-6 rounded-lg border border-border/50 hover:border-border hover:bg-accent/30 transition-colors">
            <div className="flex items-center mb-2">
              <ChatCircleText weight="duotone" className="h-5 w-5 mr-2 text-muted-foreground" />
              <h3 className="text-base font-medium text-foreground">add instructions</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              customize how the assistant responds in this project.
            </p>
            <Button className="w-full">set instructions</Button>
          </div>
        </div>
        
        {/* Project Chats */}
        <div className="mb-10">
          {/* Chat List */}
          <div className="space-y-1.5">
            {chats && chats.length > 0 ? (
              chats.map(chat => (
                <Link
                  key={chat.id}
                  href={`/p/${projectId}/c/${chat.id}`}
                  className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{chat.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {chat.updatedAt ? formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true }) : 'just now'}
                    </p>
                  </div>
                  <ChatItemMenu chatId={chat.id} />
                </Link>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center mb-4">
                  <ChatCircleDots weight="duotone" className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-foreground text-base font-medium mb-2">no chats yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  ask a question in the command bar above to start a new conversation
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 