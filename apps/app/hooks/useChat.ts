import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useChatStore, useChatData, useChatNavigation, Message, ChatMessage } from '@/lib/store/chatStore';
import { useAuth } from '@clerk/nextjs';

import { useAgent } from './useAgent';

interface UseChatOptions {
  chatId?: string;
}

export function useChat({ chatId }: UseChatOptions = {}) {
  const params = useParams();
  const resolvedChatId = chatId || (params?.id as string) || null;
  
  const agent = useAgent();

  const { isSignedIn } = useAuth();
  const { createAndNavigate } = useChatNavigation();

  // --- Zustand UI Store Usage ---
  const {
    messages,          // Current UI messages
    isLoading,         // UI loading state
    pendingMessageId,  // ID of the message awaiting AI response
    stream,            // Current streaming state (for UI rendering)
    addMessage,        // Adds a message to the UI list
    updateMessage,     // Updates a message in the UI list
    setPendingMessageId,// Sets the ID of the message being processed
    startStreaming,    // Sets streaming state in store
    appendStreamContent,// Appends content to stream and updates pending UI message
    finishStreaming,   // Finalizes streaming state and pending UI message
    resetMessages,     // Clears UI messages and stream state
    setIsLoading,      // Sets the UI loading indicator
  } = useChatStore();

  // --- SWR for Server Data ---
  const { chatData, isLoading: isLoadingChatData, mutateChat } = useChatData(resolvedChatId);

  // --- Local State & Refs ---
  const [pendingCommand, setPendingCommand] = useState<string | null>(null); // Track the command that initiated the current loading state
  const messagesRef = useRef<HTMLDivElement>(null); // For scrolling
  const prevChatIdRef = useRef<string | null>(null);
  const lastContentLengthRef = useRef<number>(0); // Track stream progress

  // --- Effects ---

  // Effect 1: Load messages from SWR cache into Zustand UI state when chatId changes or data loads
  useEffect(() => {
    if (resolvedChatId !== prevChatIdRef.current) {
      console.log(`[useChat] Chat ID changed: ${prevChatIdRef.current} -> ${resolvedChatId}. Resetting UI.`);
      resetMessages(); // Clear UI state for the previous chat
      prevChatIdRef.current = resolvedChatId || null;
      // Don't set isLoading(true) here, let SWR handle its loading state
    }

    // If we have a chatId and the SWR data is available
    if (resolvedChatId && chatData && !isLoadingChatData) {
      // Only load if the UI messages are currently empty (avoids double loading on mutation)
      const currentUiMessages = useChatStore.getState().messages;
      if (currentUiMessages.length === 0 || currentUiMessages[0]?.chatId !== resolvedChatId) {
        console.log(`[useChat] Loading ${chatData.messages?.length || 0} messages from SWR data into UI store for chat ${resolvedChatId}`);
        resetMessages(); // Ensure clean state before loading

        const serverMessages = chatData.messages || [];
        let currentUserMessage: ChatMessage | null = null;

        serverMessages.forEach((msg: ChatMessage) => {
          if (msg.type === 'user') {
            currentUserMessage = msg;
            // Add user message part to UI
            addMessage({
              type: 'standard', // Start as standard
              content: { question: msg.content },
              command: msg.content, // Use content as command placeholder
              timestamp: msg.timestamp, // Use server timestamp
              chatId: resolvedChatId || undefined,
            });
          } else if (msg.type === 'ai' && currentUserMessage) {
            // Find the last added UI message (which should be the user's)
            const lastUiMessage = useChatStore.getState().messages.slice(-1)[0];
            if (lastUiMessage && lastUiMessage.content.question === currentUserMessage.content) {
              // Update the last UI message with the AI response
              updateMessage(lastUiMessage.id, {
                content: { ...lastUiMessage.content, response: msg.content },
                timestamp: msg.timestamp, // Update timestamp
              });
              currentUserMessage = null; // Pair complete
            } else {
              // AI message without a preceding user message in the UI buffer (shouldn't normally happen with pairing)
              addMessage({
                type: 'standard',
                content: { response: msg.content },
                command: '',
                timestamp: msg.timestamp,
                chatId: resolvedChatId || undefined,
              });
            }
          } else {
            // Handle system messages or AI messages without a user pair
            addMessage({
              type: 'standard',
              content: { response: msg.content },
              command: '',
              timestamp: msg.timestamp,
              chatId: resolvedChatId || undefined,
            });
          }
        });
        console.log(`[useChat] Finished loading messages into UI store. UI messages count: ${useChatStore.getState().messages.length}`);
      }
    }
  }, [resolvedChatId, chatData, isLoadingChatData, resetMessages, addMessage, updateMessage]);

  // Effect 2: Handle auto-scrolling
  useEffect(() => {
    if (messagesRef.current) {
      const element = messagesRef.current;
      // Scroll smoothly if near the bottom, otherwise allow user control
      const isScrolledToBottom = element.scrollHeight - element.clientHeight <= element.scrollTop + 100; // 100px threshold
      if (isScrolledToBottom) {
        // Use requestAnimationFrame for smoother scrolling after render
        requestAnimationFrame(() => {
          element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
        });
      }
    }
  }, [messages, stream.content]); // Trigger scroll on new messages or stream updates

  // Effect 3: Process agent stream updates
  useEffect(() => {
    // Only process if we are actively waiting for a response
    if (!isLoading || !pendingMessageId) return;

    // Append content chunks
    if (agent.content && agent.content.length > lastContentLengthRef.current) {
      const chunk = agent.content.slice(lastContentLengthRef.current);
      appendStreamContent(chunk); // This updates stream state and pending UI message
      lastContentLengthRef.current = agent.content.length;
    }

    // Handle Tool Calls/Results (add specific UI messages)
    // Note: This adds *separate* UI messages for tools, distinct from the pending AI response.
    if (agent.isToolCall && agent.toolCallId) {
      const existingToolMsg = messages.find(m =>
        (m.type === 'toolCall' && m.content.toolCall?.toolCallId === agent.toolCallId) ||
        (m.type === 'toolResult' && m.content.toolResult?.toolCallId === agent.toolCallId)
      );

      if (!existingToolMsg) {
        if (agent.toolName && agent.toolArgs) {
          console.log(`[useChat] Adding Tool Call UI Message: ${agent.toolName}`);
          addMessage({
            type: 'toolCall',
            content: { toolCall: { toolCallId: agent.toolCallId, toolName: agent.toolName, toolArgs: agent.toolArgs } },
            command: pendingCommand || '', // Associate with the triggering command
            timestamp: Date.now(),
            chatId: resolvedChatId || undefined
          });
        } else if (agent.toolResult) {
          console.log(`[useChat] Adding Tool Result UI Message for: ${agent.toolCallId}`);
          addMessage({
            type: 'toolResult',
            content: { toolResult: { toolCallId: agent.toolCallId, toolName: agent.toolName, toolResult: agent.toolResult } },
            command: pendingCommand || '',
            timestamp: Date.now(),
            chatId: resolvedChatId || undefined
          });
        }
      } else if (existingToolMsg.type === 'toolCall' && agent.toolResult) {
        // If we previously added a toolCall message, update it to toolResult when result arrives
        console.log(`[useChat] Updating Tool Call to Tool Result UI Message for: ${agent.toolCallId}`);
        updateMessage(existingToolMsg.id, {
          type: 'toolResult',
          content: { toolResult: { toolCallId: agent.toolCallId, toolName: agent.toolName, toolResult: agent.toolResult } }
        });
      }
    }

    // Handle stream completion
    if (agent.isDone) {
      console.log('[useChat] Agent stream completed.');
      finishStreaming(agent.content); // Finalize the pending UI message
      agent.resetState(); // Reset agent for next message
      setPendingCommand(null);
      lastContentLengthRef.current = 0;
      // Mutate SWR cache to refetch updated chat history
      if (resolvedChatId) {
        console.log('[useChat] Mutating chat data after stream completion.');
        mutateChat();
      }
    }

    // Handle stream error
    if (agent.isError) {
      console.error(`[useChat] Agent stream error: ${agent.error}`);
      finishStreaming(undefined, agent.error || 'An error occurred'); // Finalize pending message as error
      agent.resetState();
      setPendingCommand(null);
      lastContentLengthRef.current = 0;
      // No need to mutate SWR on error, as nothing was saved server-side
    }
  }, [
    agent.content, agent.isDone, agent.isError, agent.isToolCall, agent.toolCallId, agent.toolName, agent.toolArgs, agent.toolResult, // Dependencies from agent
    isLoading, pendingMessageId, // Local loading state dependencies
    appendStreamContent, finishStreaming, updateMessage, addMessage, // Store actions
    mutateChat, resolvedChatId, pendingCommand, messages // SWR mutate and context
  ]);

  // --- Command Handling ---
  const handleCommand = useCallback(async (command: string) => {
    if (isLoading) {
      console.log('[useChat] Ignoring command while loading.');
      return;
    }
    if (!command.trim()) return;

    console.log(`[useChat] Handling command: ${command.substring(0, 30)}...`);
    setPendingCommand(command); // Store command for context
    agent.resetState(); // Ensure agent is ready
    lastContentLengthRef.current = 0;

    // --- Case 1: New Chat ---
    if (!resolvedChatId) {
      setIsLoading(true); // Set loading state immediately for UI feedback
      const chatTitle = command.substring(0, 30) + (command.length > 30 ? '...' : '');
      const newChatId = await createAndNavigate(chatTitle, command);
      if (!newChatId) {
        // Handle creation failure (e.g., show error toast)
        setIsLoading(false); // Reset loading state on failure
        setPendingCommand(null);
      }
      // Navigation will trigger chatId change, loading effect, etc.
      // isLoading will be reset by the loading effect or finishStreaming
      return;
    }

    // --- Case 2: Existing Chat ---
    setIsLoading(true); // Set loading state

    try {
      // 1. Save User Message to DB via API
      const userMessageResponse = await fetch(`/api/chats/${resolvedChatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: command, type: 'user' }),
      });

      if (!userMessageResponse.ok) {
        throw new Error('Failed to save user message');
      }
      // const savedUserMessage = await userMessageResponse.json(); // Optional: use if needed

      // 2. Add User Message and Pending AI Message to UI Store
      addMessage({
        type: 'standard', // Add user message definitively
        content: { question: command },
        command: command,
        timestamp: Date.now(), // Use client time for UI sorting initially
        chatId: resolvedChatId || undefined
      });
      const pendingAIMsg = addMessage({
        type: 'pending',
        content: { question: command, response: '...' }, // Keep question context
        command: command,
        timestamp: Date.now() + 1, // Ensure it appears after user message
        chatId: resolvedChatId || undefined
      });
      setPendingMessageId(pendingAIMsg.id); // Track the AI message placeholder

      // 3. Start Streaming State in Store
      startStreaming(command);

      // 4. Call Agent
      await agent.sendMessage(command, { threadId: resolvedChatId, resourceId: resolvedChatId });

      // 5. Stream processing and finalization is handled by Effect 3

    } catch (error) {
      console.error('[useChat] Error processing command:', error);
      // Add error message to UI store
      addMessage({
        type: 'error',
        content: { question: command, error: error instanceof Error ? error.message : 'Failed to process command' },
        command: command,
        timestamp: Date.now(),
        chatId: resolvedChatId || undefined
      });
      // Reset loading states
      setIsLoading(false);
      setPendingCommand(null);
      setPendingMessageId(null); // Clear pending ID on error
      finishStreaming(undefined, error instanceof Error ? error.message : 'Failed to process command'); // Also reset stream state
      agent.resetState();
    }
  }, [
    isLoading, resolvedChatId, agent, createAndNavigate, // Hooks & Context
    setIsLoading, addMessage, setPendingMessageId, startStreaming, finishStreaming, // Store actions
    isSignedIn, // Auth state
  ]);

  // --- Public API of the Hook ---
  return {
    // State
    messages,         // UI messages from Zustand store
    isLoading: isLoading || isLoadingChatData, // Combine UI loading and SWR loading
    isStreaming: stream.isStreaming, // Expose streaming status
    streamContent: stream.content, // Expose current stream buffer
    chatData,         // Raw chat data from SWR (includes server messages)

    // Refs
    messagesRef,      // Ref for scroll container

    // Actions
    handleCommand,    // Function to submit a new command/message
  };
} 