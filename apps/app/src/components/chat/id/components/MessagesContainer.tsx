import React, { useEffect, useRef } from "react";
import { Message } from "ai";
import { MessageItem } from "./message-item";
import { cn } from "@/src/lib/utils";

interface MessagesContainerProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessagesContainer({ messages, isLoading = false }: MessagesContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Effect to handle scroll behavior
  useEffect(() => {
    if (containerRef.current && messages.length > 0) {
      // Scroll to bottom when new messages come in
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
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
        {messages.map((message: Message, index: number) => (
          <div key={`${message.id}-${index}`}>
            <MessageItem
              message={{
                id: message.id,
                type: message.role === 'assistant' ? 'standard' : 'standard',
                content: message.role === 'user' 
                  ? { question: message.content } 
                  : { response: message.content },
                command: message.role === 'user' ? message.content : '',
                timestamp: message.createdAt?.getTime() || Date.now(),
              }}
              isTransitioning={isLoading && index === messages.length - 1}
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
