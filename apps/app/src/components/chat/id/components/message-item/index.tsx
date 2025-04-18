import React, { useMemo } from "react";
import { Message } from "@/src/store/data/chat";
import { UserMessage } from "./components/UserMessage";
import { SystemMessage } from "./components/SystemMessage";

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUserMessage = useMemo(() => {
    return message.content.question !== undefined;
  }, [message.content]);

  const isAIMessage = useMemo(() => {
    return message.content.response !== undefined;
  }, [message.content]);

  return (
    <div className="flex items-start gap-2 group relative">
      {/* Message content */}
      <div className="flex-1 overflow-hidden">
        {isUserMessage && (
          <UserMessage content={message.content.question || ""} userInitials={"LN"} />
        )}
        
        {isAIMessage && (
          <SystemMessage 
            content={message.content.response || ""}
            onDownload={() => {}}
          />
        )}
      </div>
    </div>
  );
}
