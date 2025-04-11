import React, { useEffect, useRef } from "react";
import { Message } from "@/lib/store/chatStore";
import { MessageItem } from "./message-item";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

interface MessagesContainerProps {
  chatId: string;
}

export function MessagesContainer({ chatId }: MessagesContainerProps) {
  const { messages: uiMessages, isStreaming: isTransitioning, handleCommand } = useChat({ chatId });
  const containerRef = useRef<HTMLDivElement>(null);

  // Effect to handle scroll behavior
  useEffect(() => {
    if (containerRef.current && uiMessages.length > 0) {
      // Scroll to bottom when new messages come in
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [uiMessages]);

  if (uiMessages.length === 0) {
    return null;
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full max-w-2xl mx-auto h-full overflow-y-auto px-8 pt-4 pb-2"
      style={{
        // Custom scrollbar styling
        scrollbarWidth: 'thin', // Firefox
        scrollbarColor: 'rgba(100, 116, 139, 0.2) transparent', // Firefox
      }}
    >
      <div className="space-y-4">
        {uiMessages.map((message: Message, index: number) => (
          <div key={`${message.id}-${index}`}>
            <MessageItem
              message={message}
              onCommand={handleCommand}
              onDownload={() => {}}
              isTransitioning={isTransitioning && index === uiMessages.length - 1}
            />
          </div>
        ))}
      </div>

      {/* Custom scrollbar styling for WebKit browsers (Chrome, Safari, Edge) */}
      <style jsx>{`
        div::-webkit-scrollbar {
          width: 8px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          background-color: rgba(100, 116, 139, 0.2);
          border-radius: 20px;
          border: 3px solid transparent;
        }
      `}</style>
    </div>
  );
}
