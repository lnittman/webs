import React, { useEffect, useState, useCallback } from "react";
import { useChat } from "ai/react";
import { useSidebar } from "@/src/components/sidebar/SidebarProvider";
import { cn } from "@/src/lib/utils";
import { useMediaQuery } from "@repo/design/hooks/use-media-query";
import { MessagesContainer } from "./components/MessagesContainer";
import { PromptBar } from "../../shared/prompt-bar";
import { useChatData } from "@/src/store/data/chat";

interface ChatProps {
  chatId?: string;
  isTransitioning?: boolean;
}

export function Chat({ chatId, isTransitioning: propTransitioning = true }: ChatProps) {
  const chatIdValue = chatId || "";
  const [isTransitioning, setIsTransitioning] = useState(propTransitioning);
  const { isOpen: isSidebarOpen } = useSidebar();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [contentReady, setContentReady] = useState(false);
  
  // Get chat data for resourceId
  const { chatData } = useChatData(chatIdValue);
  
  // Initialize useChat hook with current chatId as threadId
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop
  } = useChat({
    id: chatIdValue, // Use chatId as the unique identifier
    api: "/api/chat", // Your API endpoint
    experimental_prepareRequestBody: (request) => {
      // Only send the latest message to avoid duplication
      const lastMessage = request.messages.length > 0 
        ? request.messages[request.messages.length - 1] 
        : null;
      
      return {
        message: lastMessage,
        threadId: chatIdValue,
        resourceId: chatData?.projectId || "default"
      };
    }
  });
  
  // Update window width on resize
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Set content as ready after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setContentReady(true);
      setIsTransitioning(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // When chatId changes, reset states to prepare for new content
  useEffect(() => {
    setIsTransitioning(true);
    setContentReady(false);
    
    const timer = setTimeout(() => {
      setContentReady(true);
      setIsTransitioning(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [chatId]);

  // Calculate command bar position and width based on sidebar state and window width
  const getCommandBarStyle = useCallback(() => {
    if (!isDesktop) return {};
    
    // Calculate sidebar width
    const sidebarWidth = isSidebarOpen ? 280 : 48;
    const availableWidth = windowWidth - sidebarWidth;
    const centerPoint = sidebarWidth + (availableWidth / 2);
    
    // Calculate width - adjust as needed to match MessagesContainer
    const maxWidth = Math.min(2.5 * availableWidth / 3, 768); // Cap at reasonable max width
    
    return {
      left: `${centerPoint}px`,
      transform: 'translateX(-50%)',
      maxWidth: `${maxWidth}px`,
      width: `${Math.min(availableWidth * 0.9, maxWidth)}px`,
      transition: 'left 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease, width 0.3s cubic-bezier(0.32, 0.72, 0, 1), max-width 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
    };
  }, [isDesktop, isSidebarOpen, windowWidth]);

  return (
    <div 
      className={cn(
        "flex flex-col h-full min-h-[calc(100vh)] items-center relative bg-background text-foreground transition-opacity duration-300 ease-in-out",
        isTransitioning || !contentReady ? "opacity-0" : "opacity-100"
      )}
    >
      {/* Container for messages with fixed height and scrollable */}
      <div className="absolute inset-0 overflow-hidden">
        <MessagesContainer 
          messages={messages} 
          isLoading={isLoading} 
        />
      </div>

      {/* CommandBar with fixed positioning at the bottom */}
      <div 
        className={cn(
          "fixed bottom-6 z-50 transition-opacity duration-300",
          isDesktop ? "" : "w-[92%] left-1/2 -translate-x-1/2",
          isTransitioning ? "opacity-0" : "opacity-100"
        )}
        style={getCommandBarStyle()}
      >
        <PromptBar 
          input={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          stop={stop}
        />
      </div>
    </div>
  );
} 