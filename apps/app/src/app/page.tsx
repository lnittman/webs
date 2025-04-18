"use client";

import React from "react";
import { NewChat } from "@/src/components/chat/new";
import { useAuth } from "@clerk/nextjs";

export default function Home() {
  const { isLoaded } = useAuth();
  
  // Handle the case where we're still loading auth state
  if (!isLoaded) {
    return null; // or a loading spinner
  }
  
  // Show the unified Chat component without an ID to indicate it's a new chat
  return <NewChat />;
}
