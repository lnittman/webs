"use client";

import React from "react";
import { Chat } from "@/components/chat/id";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const chatId = resolvedParams.id;
  
  return <Chat chatId={chatId} />;
}
