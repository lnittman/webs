"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { NewChat } from "@/components/chat/new";
import { useChatNavigation } from "@/lib/store/chatStore";
import { useAuth } from "@clerk/nextjs";

export default function Home() {
  const router = useRouter();
  const { isLoaded } = useAuth();
  const { createAndNavigate } = useChatNavigation();
  
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
  
  // Handle the case where we're still loading auth state
  if (!isLoaded) {
    return null; // or a loading spinner
  }
  
  // Show the unified Chat component without an ID to indicate it's a new chat
  return <NewChat onCommand={handleCommand} />;
}
