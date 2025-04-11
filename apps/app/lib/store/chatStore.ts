import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import useSWR, { useSWRConfig } from 'swr';

// SWR fetcher
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('An error occurred while fetching the data.');
  return res.json();
});

/**
 * Chat message types for persistence and display
 */
export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'ai' | 'system';
  timestamp: number;
  createdAt?: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  projectId?: string;
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

export interface Message {
  id: string;
  type: MessageType;
  content: MessageContent;
  command: string;
  timestamp: number;
  chatId?: string;
}

/**
 * Stream state (used during streaming)
 */
export interface StreamState {
  isStreaming: boolean;
  content: string;
  command: string;
}

/**
 * Refactored Chat Store State for UI Management
 */
interface ChatUIStoreState {
  // UI display state for the CURRENT chat
  messages: Message[];
  isLoading: boolean; // Indicates if waiting for AI response or initial load
  pendingMessageId: string | null;
  stream: StreamState;

  // Actions - UI Message management
  addMessage: (message: Omit<Message, 'id'>) => Message;
  updateMessage: (messageId: string, updates: Partial<Omit<Message, 'id'>>) => void;
  removeMessage: (messageId: string) => void;
  setPendingMessageId: (messageId: string | null) => void;
  resetMessages: () => void; // Resets UI state for the current chat

  // Actions - Streaming UI
  startStreaming: (command: string) => void;
  appendStreamContent: (contentChunk: string) => void; // Changed param name for clarity
  finishStreaming: (finalContent?: string, error?: string) => void; // Allow passing final state

  // Actions - Loading state
  setIsLoading: (value: boolean) => void;
}

/**
 * Refactored Chat Store Implementation (UI Focused)
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
    // No persistence middleware needed for transient UI state
    {
      name: 'chat-ui-store' // Renamed to reflect purpose
    }
  )
);

// --- Hooks using SWR for Server Data ---

// Hook to fetch all chat metadata (for sidebar)
export function useChats() {
  const { isSignedIn } = useAuth();
  const { data, error, mutate } = useSWR(
    isSignedIn ? '/api/chats' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      suspense: false,
      revalidateOnMount: true,
      dedupingInterval: 30000 // 30 seconds
    }
  );

  return {
    chats: data as Chat[] | undefined, // Type assertion
    isLoading: !error && !data,
    isError: !!error,
    mutateChats: mutate // Expose mutate for external invalidation
  };
}

// Hook to fetch a single chat's full data (including messages)
export function useChatData(chatId: string | null) {
  const { data, error, mutate } = useSWR<Chat>(
    chatId ? `/api/chats/${chatId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      suspense: false,
      revalidateOnMount: true // Fetch when component mounts or chatId changes
    }
  );

  return {
    chatData: data,
    isLoading: !error && !data && !!chatId, // Only loading if chatId exists and no data/error
    isError: !!error,
    mutateChat: mutate // Expose mutate for specific chat invalidation
  };
}

// --- Navigation Hook (Handles API calls for creation) ---
export function useChatNavigation() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { mutate } = useSWRConfig(); // Get global mutate function

  const createAndNavigate = async (title: string, initialMessage?: string, projectId?: string) => {
    if (!isSignedIn) {
      console.warn("[useChatNavigation] User not signed in. Cannot create chat on server.");
      // Optionally handle local-only chat creation or redirect to sign-in
      router.push('/signin'); // Redirect to sign in
      return null; // Indicate failure or no ID
    }

    console.log('[useChatNavigation] Creating chat via API:', { title, initialMessage: !!initialMessage, projectId });
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message: initialMessage, projectId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create chat: ${response.status}`);
      }

      const serverChat = await response.json();
      console.log('[useChatNavigation] Chat created via API:', serverChat);

      // Invalidate the chat list cache so the sidebar updates
      await mutate('/api/chats');

      // Navigate to the new chat
      const newChatId = serverChat.id;
      const path = projectId ? `/p/${projectId}/c/${newChatId}` : `/c/${newChatId}`;
      router.push(path);

      return newChatId; // Return the new ID

    } catch (error) {
      console.error('[useChatNavigation] Error creating chat via API:', error);
      // Handle error (e.g., show toast notification)
      return null; // Indicate failure
    }
  };

  const navigateToChat = (chatId: string, projectId?: string) => {
    const path = projectId ? `/p/${projectId}/c/${chatId}` : `/c/${chatId}`;
    router.push(path);
  };

  return { createAndNavigate, navigateToChat };
}

// Simplified hook to fetch chat data with SWR
export function useChat(chatId: string) {
  return useSWR(
    chatId ? `/api/chats/${chatId}` : null,
    async (url) => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch chat');
        const data = await res.json();
        return { messages: data.messages || [], ...data };
      } catch (error) {
        console.error('Error fetching chat:', error);
        return { messages: [] };
      }
    },
    { 
      revalidateOnFocus: false,
      suspense: false 
    }
  );
} 