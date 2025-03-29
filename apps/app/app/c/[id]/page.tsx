"use client";

import React from "react";
import { Chat } from "@/components/chat/id";

export default function ChatPage({ params }: { params: { id: string } }) {
  // Use React.use to unwrap params (handles the Next.js warning)
  const unwrappedParams = React.use(Promise.resolve(params));
  
  return (
    <Chat id={unwrappedParams.id} />
  );
}
