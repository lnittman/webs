"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NewChat } from "@/components/chat/new";
import { Chat } from "@/components/chat/id";
import { useChatHistoryStore } from "@/lib/store/chatHistoryStore";
import { useAuth } from "@clerk/nextjs";

export default function Home() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { currentChatId, hasCreatedFirstChat, resetChatCreationFlag, setCurrentChat } = useChatHistoryStore();
  
  useEffect(() => {
    setCurrentChat(null);
  }, [setCurrentChat]);
  
  // Reset the chat creation flag when unmounting (navigating away)
  useEffect(() => {
    return () => {
      resetChatCreationFlag();
    };
  }, [resetChatCreationFlag]);
  
  // If user is signed in and has created a chat, redirect to the chat page
  useEffect(() => {
    if (isLoaded && isSignedIn && hasCreatedFirstChat && currentChatId) {
      router.push(`/c/${currentChatId}`);
    }
  }, [isLoaded, isSignedIn, hasCreatedFirstChat, currentChatId, router]);
  
  // Handle the case where we're still loading auth state
  if (!isLoaded) {
    return null; // or a loading spinner
  }
  
  // For signed-out users:
  // - If they have submitted a prompt, show Chat with the current chat ID
  // - Otherwise, show NewChat
  if (!isSignedIn) {
    return hasCreatedFirstChat && currentChatId ? (
      <Chat id={currentChatId} />
    ) : (
      <NewChat />
    );
  }
  
  // For signed-in users, just show NewChat (they'll be redirected if they submit)
  return <NewChat />;
}
