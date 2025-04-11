"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProjectView } from "@/components/project/components/ProjectView";
import { useProject } from "@/lib/store/projectStore";
import { useChatNavigation } from "@/lib/store/chatStore";
import { useAuth } from "@clerk/nextjs";

export default function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const resolvedParams = React.use(params);
  const { projectId } = resolvedParams;

  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { data: project, isLoading: isProjectLoading, error } = useProject(projectId);
  const { createAndNavigate } = useChatNavigation();
  
  // State for UI management
  const [isLoading, setIsLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  
  // Handle commands from the command bar
  const handleCommand = useCallback(async (command: string) => {
    setIsLoading(true);
    
    try {
      // Create a new chat in this project
      const chatId = await createAndNavigate(
        command.length > 30 ? `${command.substring(0, 30)}...` : command, 
        command,
        projectId
      );
      
      // Navigate to the chat within the project
      router.push(`/p/${projectId}/c/${chatId}`);
    } catch (error) {
      console.error("Error creating chat:", error);
      setIsLoading(false);
    }
  }, [createAndNavigate, projectId, router]);
  
  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (isSignedIn === false) {
      router.push('/signin');
    }
  }, [isSignedIn, router]);
  
  // Handle error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-semibold mb-4">Project not found</h1>
        <p className="text-muted-foreground mb-6">
          The project you're looking for doesn't exist or you don't have access to it.
        </p>
        <button 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          onClick={() => router.push('/')}
        >
          Go Home
        </button>
      </div>
    );
  }
  
  return (
    <ProjectView
      projectId={projectId}
      projectName={project?.name || "Loading project..."}
      chats={project?.chats || []}
      isLoading={isLoading || isProjectLoading}
      messagesRef={messagesRef as React.RefObject<HTMLDivElement>}
      onCommand={handleCommand}
    />
  );
} 