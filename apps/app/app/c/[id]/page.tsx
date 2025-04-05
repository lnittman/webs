"use client";

import React from "react";
import { Chat } from "@/components/chat/id";

export default function ChatPage({ params }: { params: { id: string } }) {
  // Don't use React.use which causes the suspension error
  return (
    <Chat id={params.id} />
  );
}
