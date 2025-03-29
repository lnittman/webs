import React, { useEffect, useState, useCallback, useRef } from "react";
import { CommandBar } from "../components/CommandBar";
import { PresetMenu } from "../id/components/preset-menu";
import { MessagesContainer } from "./components/MessagesContainer";
import { 
  useResultsStore, 
  CommandResult,
  CommandType
} from "@/lib/store/resultsStore";
import { useAtom } from "jotai";
import { activeContextAtom, addToCommandHistoryAtom, commandInputAtom } from "@/lib/store/settingsStore";
import { useMediaQuery } from "@repo/design/hooks/use-media-query";
import { useUser } from "@clerk/nextjs";
import { useChatHistoryStore } from "@/lib/store/chatHistoryStore";
import { useAgentStream, isUrl } from "@repo/agents/src/hooks";
import { useSearchParams } from "next/navigation";

// Debounce helper function
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}

interface ChatProps {
  id?: string;
}

export function Chat({ id }: ChatProps) {
  // Get URL search params
  const searchParams = useSearchParams();
  
  // Use Zustand for results and loading state
  const { 
    results, 
    isLoading, 
    addResult, 
    updatePendingResult, 
    setIsLoading,
    resetResults
  } = useResultsStore();
  
  // Use Jotai for active context and command history
  const [activeContext, setActiveContext] = useAtom(activeContextAtom);
  const [_, addToCommandHistory] = useAtom(addToCommandHistoryAtom);
  const { user } = useUser();
  const { chats } = useChatHistoryStore();

  // Use our custom streaming hook
  const agentStream = useAgentStream();
  
  // Track previous chat ID to reset results on navigation
  const [prevChatId, setPrevChatId] = useState<string | null>(null);
  
  // Track if we've initialized this chat already
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Track if we've sent a command request to avoid duplicates
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);

  // Add state for auto-scrolling
  const [autoScroll, setAutoScroll] = useState(true);

  // Ref to track the message container for auto-scrolling
  const messagesRef = useRef<HTMLDivElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      agentStream.resetStream();
    };
  }, []);

  // Reset results when navigating to a different chat
  useEffect(() => {
    if (id && prevChatId !== id) {
      // Reset results when navigating to a new chat
      console.log(`[Chat] Resetting results for chat ID change: ${prevChatId} -> ${id}`);
      resetResults();
      setPrevChatId(id);
      setHasInitialized(false); // Reset initialization flag
      setPendingCommand(null); // Reset pending command
    }
  }, [id, prevChatId, resetResults]);

  // Auto-scroll when content changes if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [results, agentStream.streamingContent, autoScroll]);
  
  // Detect scroll events to disable auto-scroll when user manually scrolls up
  const handleScroll = useCallback(() => {
    if (!messagesRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    setAutoScroll(isAtBottom);
  }, []);

  // Command handler with duplicate prevention
  const handleCommandInternal = useCallback(async (command: string, options?: { mode?: 'main' | 'spin' | 'think' }) => {
    if (isLoading) {
      console.log('[Chat] Ignoring command while loading: ', command.substring(0, 30));
      return;
    }
    
    // Check if this is a duplicate of a pending command
    if (pendingCommand === command) {
      console.log('[Chat] Ignoring duplicate command: ', command.substring(0, 30));
      return;
    }
    
    console.log(`[Chat] Handling command: "${command.substring(0, 30)}${command.length > 30 ? '...' : ''}" with options:`, options);
    
    // Set this as the pending command to prevent duplicates
    setPendingCommand(command);
    
    // First, reset any previous stream state
    agentStream.resetStream();
    
    setIsLoading(true);
    addToCommandHistory(command);
    
    // Get the mode from options
    const mode = options?.mode || 'main';
    
    // Create a pending result
    const pendingResult: CommandResult = {
      type: mode as CommandType,
      content: {
        question: command,
        response: "Processing..."
      },
      command,
      timestamp: Date.now(),
    };
    
    addResult(pendingResult);
    
    try {
      // Determine if the input is a URL
      const isDirectUrl = isUrl(command);
      
      // If it's a URL, add it to active context
      if (isDirectUrl) {
        setActiveContext(command);
        console.log(`[Chat] URL detected, set as active context: ${command}`);
      }
      
      // Create the stream request based on input type
      const streamRequest = {
        mode,
        ...(isDirectUrl ? { url: command } : { query: command })
      };
      
      console.log(`[Chat] Streaming request:`, streamRequest);
      
      // Process with our streaming hook (no branching required)
      await agentStream.startStreaming(streamRequest, command);
      
      // After stream is done, preserve the content by updating the pending result
      // Only if the stream completed successfully
      if (agentStream.isDone) {
        console.log(`[Chat] Stream completed successfully, updating result`);
        updatePendingResult(pendingResult, {
          type: mode as CommandType,
          content: {
            question: command,
            response: agentStream.streamingContent,
          },
          command,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      // Handle errors
      console.error(`[Chat] Error processing command:`, error);
      updatePendingResult(pendingResult, {
        type: 'error' as CommandType,
        content: error instanceof Error ? error.message : 'An error occurred',
        command,
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
      setPendingCommand(null); // Clear the pending command
    }
  }, [
    isLoading, setIsLoading, addToCommandHistory, addResult, 
    agentStream, updatePendingResult, setActiveContext, pendingCommand
  ]);

  // Debounced version of handle command to prevent rapid duplicate submissions
  const handleCommand = useCallback(
    debounce((command: string, options?: { mode?: 'main' | 'spin' | 'think' }) => {
      handleCommandInternal(command, options);
    }, 250),
    [handleCommandInternal]
  );

  // Carefully controlled initialization effect
  useEffect(() => {
    // Only run if we have an ID, aren't already initialized, aren't loading, and have no pending command
    if (!id || hasInitialized || isLoading || pendingCommand) return; 
    
    // Process URL parameters first if they exist
    const urlParams = searchParams?.toString();
    console.log(`[Chat] Initializing chat with params: ${urlParams || 'none'}`);
    
    const mode = searchParams?.get('mode') as 'main' | 'spin' | 'think' || 'main';
    const currentChat = chats.find(chat => chat.id === id);
    
    // If we don't have chat messages, we can't proceed
    if (!currentChat?.messages?.length) {
      console.log('[Chat] No messages found for chat, marking as initialized');
      setHasInitialized(true);
      return;
    }
    
    // Get the initial message
    const initialMessage = currentChat.messages[0];
    if (initialMessage.type !== 'user') {
      console.log('[Chat] First message is not from user, marking as initialized');
      setHasInitialized(true);
      return;
    }
    
    // We have a valid message to process
    const messageContent = initialMessage.content;
    console.log(`[Chat] Initializing chat ${id} with message: ${messageContent.substring(0, 30)}...`);
    
    // Set as initialized BEFORE processing to prevent duplicate processing
    setHasInitialized(true);
    
    // Small delay to ensure state updates before processing
    setTimeout(() => {
      // Process the initial message with the correct mode from URL params if present
      handleCommandInternal(messageContent, { mode });
    }, 50);
    
  }, [id, chats, handleCommandInternal, isLoading, hasInitialized, searchParams, pendingCommand]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-background text-foreground blur-container overflow-hidden">
      <div className="flex flex-col h-full w-full max-w-3xl mx-auto px-4 relative">
        {/* Messages Container - Make this scrollable */}
        <div 
          ref={messagesRef}
          className="flex-grow overflow-y-auto hide-scrollbar pb-4"
          onScroll={handleScroll}
        >
          {/* Show message results */}
          <MessagesContainer 
            results={results} 
            onCommand={handleCommand} 
            userName={user?.firstName ?? null} 
          />
          
          {/* Streaming indicator - Only show if we have active streaming content */}
          {agentStream.isStreaming && (
            <div className="flex flex-col pl-1 animate-fade-in mb-8">
              {/* Display user's command in the right-aligned bubble format */}
              {agentStream.streamingCommand && results.length === 0 && (
                <div className="flex justify-end mb-6">
                  <div className="bg-muted/40 border border-border/40 rounded-2xl px-4 py-3 text-sm max-w-[80%]">
                    <p className="text-foreground whitespace-pre-wrap">{agentStream.streamingCommand}</p>
                  </div>
                </div>
              )}
              
              {/* Display the streaming response */}
              <div className="space-y-2 w-full">
                <div className="text-sm text-foreground whitespace-pre-wrap">
                  {agentStream.streamingContent ? (
                    <div className="animate-fade-in">
                      {agentStream.streamingContent}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-foreground/60 animate-pulse" />
                      <div className="h-1.5 w-1.5 rounded-full bg-foreground/60 animate-pulse delay-150" />
                      <div className="h-1.5 w-1.5 rounded-full bg-foreground/60 animate-pulse delay-300" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Command Bar - Fixed at bottom with subtle shadow and blur effect */}
        <div className="sticky bottom-0 py-4 bg-background/95 backdrop-blur-sm border-t border-border/10 shadow-sm z-10">
          <CommandBar onCommand={handleCommand} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
} 