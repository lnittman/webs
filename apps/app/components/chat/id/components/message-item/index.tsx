import React from "react";
import { useUser } from "@clerk/nextjs";
import { Message } from "@/lib/store/chatStore";
import {
  StandardMessage,
  ErrorMessage,
  PendingMessage,
  ToolCallMessage,
  ToolResultMessage
} from "./components";

interface MessageItemProps {
  isTransitioning?: boolean;
  message: Message;
  onCommand?: (command: string) => void;
  onDownload?: (content: string, title: string) => void;
}

export function MessageItem({ 
  isTransitioning = true,
  message,
  onCommand,
  onDownload = () => {}
}: MessageItemProps) {
  const { user } = useUser();
  
  // Get user initials for avatar fallback
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : user?.emailAddresses?.[0]?.emailAddress?.charAt(0).toUpperCase() || "?";

  // Determine the type of content to render
  if (!message || !message.content) {
    return null;
  }

  // Use the message's type property directly instead of trying to access message.content.type
  const type = message.type || "standard";
  const content = message.content;

  switch (type) {
    case "standard":
      return (
        <StandardMessage
          content={content}
          userInitials={initials}
          onDownload={onDownload}
        />
      );
    
    case "error":
      return <ErrorMessage content={content} />;
    
    case "pending":
      return <PendingMessage content={content} />;
    
    case "toolCall":
      return <ToolCallMessage content={content} onCommand={onCommand} />;
    
    case "toolResult":
      return <ToolResultMessage content={content} />;
    
    default:
      console.error(`Unsupported message type: ${type}`);
      return <div className="text-destructive px-6">Unsupported message type: {type}</div>;
  }
}
