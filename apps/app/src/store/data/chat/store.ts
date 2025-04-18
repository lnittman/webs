import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ChatUIStoreState, Message, StreamState } from "./types";

/**
 * Message types for UI display
 */
export type MessageType = 
  'standard' | 'pending' | 'error' | 'toolCall' | 'toolResult';

export interface MessageContent {
  question?: string;
  response?: string;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
  error?: string;
}

/**
 * Tool related types for UI display
 */
export interface ToolCall {
  toolCallId: string;
  toolName: string;
  toolArgs: any;
}

export interface ToolResult {
  toolCallId: string;
  toolName?: string; 
  toolResult: any;
}

/**
 * Chat Store Implementation (UI Focused)
 */
export const useChatStore = create<ChatUIStoreState>()(
  devtools(
    (set, get) => ({
      // Initial UI State
      messages: [],
      isLoading: false,
      pendingMessageId: null,
      stream: {
        isStreaming: false,
        content: '',
        command: '',
      },

      // --- UI Message Actions ---
      addMessage: (messageData) => {
        const newMessage = {
          id: crypto.randomUUID(),
          ...messageData,
          timestamp: messageData.timestamp || Date.now(),
        };
        set(state => ({
          messages: [...state.messages, newMessage]
        }));
        console.log(`[ChatStore] Added UI Message: ${newMessage.id}, Type: ${newMessage.type}`);
        return newMessage;
      },

      updateMessage: (messageId, updates) => {
        set(state => {
          const messageIndex = state.messages.findIndex(m => m.id === messageId);
          if (messageIndex === -1) {
            console.warn(`[ChatStore] Update failed: Message ID ${messageId} not found in UI messages.`);
            return state;
          }
          const updatedMessages = [...state.messages];
          updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            ...updates,
            // Ensure content is merged correctly if provided
            content: {
              ...updatedMessages[messageIndex].content,
              ...(updates.content || {}),
            },
            timestamp: Date.now() // Use timestamp to ensure re-render
          };
          console.log(`[ChatStore] Updated UI Message: ${messageId}, New Type: ${updates.type || updatedMessages[messageIndex].type}`);
          return { messages: updatedMessages };
        });
      },

      removeMessage: (messageId) => {
        set(state => ({
          messages: state.messages.filter(m => m.id !== messageId),
          pendingMessageId: state.pendingMessageId === messageId ? null : state.pendingMessageId
        }));
        console.log(`[ChatStore] Removed UI Message: ${messageId}`);
      },

      setPendingMessageId: (messageId) => {
        set({ pendingMessageId: messageId });
        console.log(`[ChatStore] Set Pending UI Message ID: ${messageId}`);
      },

      resetMessages: () => {
        set({
          messages: [],
          pendingMessageId: null,
          stream: { isStreaming: false, content: '', command: '' },
          isLoading: false // Reset loading state as well
        });
        console.log('[ChatStore] Reset UI Messages and Stream State');
      },

      // --- Streaming UI Actions ---
      startStreaming: (command) => {
        set({
          stream: { isStreaming: true, content: '', command },
          isLoading: true // Indicate loading during streaming
        });
        console.log(`[ChatStore] Started Streaming UI for command: ${command.substring(0,30)}...`);
      },

      appendStreamContent: (contentChunk) => {
        set(state => {
          const newContent = state.stream.content + contentChunk;
          // Update pending message in UI if exists
          const pendingId = state.pendingMessageId;
          if (pendingId) {
            const messageIndex = state.messages.findIndex(m => m.id === pendingId);
            if (messageIndex !== -1) {
              const updatedMessages = [...state.messages];
              updatedMessages[messageIndex] = {
                ...updatedMessages[messageIndex],
                content: {
                  ...updatedMessages[messageIndex].content,
                  response: newContent // Update response with accumulating content
                },
                timestamp: Date.now() // Force update
              };
              console.log(`[ChatStore] Appending stream, Pending UI Message ${pendingId} response length: ${newContent.length}`);
              return {
                stream: { ...state.stream, content: newContent },
                messages: updatedMessages
              };
            }
          }
          // If no pending message, just update stream state
          console.log(`[ChatStore] Appending stream, Total stream length: ${newContent.length}`);
          return { stream: { ...state.stream, content: newContent } };
        });
      },

      finishStreaming: (finalContent, error) => {
        console.log(`[ChatStore] Finishing Streaming UI. Final Length: ${finalContent?.length ?? get().stream.content.length}, Error: ${error}`);
        const { pendingMessageId, stream } = get();
        const contentToUse = finalContent ?? stream.content; // Use final content if provided

        if (pendingMessageId) {
          get().updateMessage(pendingMessageId, {
            type: error ? 'error' : 'standard',
            content: {
              ...(get().messages.find(m => m.id === pendingMessageId)?.content || {}), // Preserve question
              response: error ? undefined : contentToUse, // Set final response or clear on error
              error: error // Set error message
            }
          });
          get().setPendingMessageId(null); // Clear pending ID
        }

        set({
          stream: { isStreaming: false, content: '', command: '' },
          isLoading: false // Streaming finished, stop loading indicator
        });
      },

      // --- Loading State Action ---
      setIsLoading: (value) => {
        set({ isLoading: value });
        console.log(`[ChatStore] Set isLoading UI State: ${value}`);
      }
    }),
    {
      name: 'chat-ui-store' // Renamed to reflect purpose
    }
  )
); 