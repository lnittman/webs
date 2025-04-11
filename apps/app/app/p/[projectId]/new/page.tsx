"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NewChatView } from "@/components/chat/new/new-chat";
import { useChatNavigation } from "@/lib/store/chatStore";
import { useProject } from "@/lib/store/projectStore";
import { useAuth, useUser } from "@clerk/nextjs";

export default function NewProjectChatPage({ 
  params 
}: { 
  params: { projectId: string } 
}) {
  const { projectId } = params;
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { data: project, isLoading: isProjectLoading } = useProject(projectId);
  const { createAndNavigate } = useChatNavigation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFading, setIsFading] = useState(false);
  
  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (isSignedIn === false) {
      router.push('/signin');
    }
  }, [isSignedIn, router]);
  
  // Handle command from the command bar
  const handleCommand = useCallback(async (command: string) => {
    if (!command.trim()) return;
    
    setIsLoading(true);
    setIsFading(true);
    
    try {
      // Create a new chat with this command as the first message
      const title = command.length > 30 ? `${command.substring(0, 30)}...` : command;
      const chatId = await createAndNavigate(title, command, projectId);
      
      // Navigate to the chat within the project instead of the regular chat route
      router.push(`/p/${projectId}/c/${chatId}`);
    } catch (error) {
      console.error("Error creating chat:", error);
      setIsLoading(false);
      setIsFading(false);
    }
  }, [createAndNavigate, projectId, router]);
  
  const displayName = user?.firstName || 'there';
  
  return (
    <NewChatView
      userName={displayName}
      isLoading={isLoading || isProjectLoading}
      isFading={isFading}
      onCommand={handleCommand}
    />
  );
} 