import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

// Types for chat history
export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'ai' | 'system';
  mode?: 'main' | 'spin' | 'think';
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface ChatHistoryState {
  chats: Chat[];
  currentChatId: string | null;
  isLoading: boolean;
  error: string | null;
  hasCreatedFirstChat: boolean;
  
  // Actions
  createChat: (title: string, initialMessage?: string) => Chat;
  addMessageToChat: (chatId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setCurrentChat: (chatId: string | null) => void;
  deleteChat: (chatId: string) => void;
  updateChatTitle: (chatId: string, title: string) => void;
  fetchChats: () => Promise<void>;
  resetChatCreationFlag: () => void;
}

// Create the store
export const useChatHistoryStore = create<ChatHistoryState>()(
  devtools(
    persist(
      (set, get) => ({
        chats: [],
        currentChatId: null,
        isLoading: false,
        error: null,
        hasCreatedFirstChat: false,
        
        // Create a new chat
        createChat: (title: string, initialMessage?: string) => {
          const newChatId = crypto.randomUUID();
          const timestamp = Date.now();
          
          const newChat: Chat = {
            id: newChatId,
            title,
            messages: initialMessage 
              ? [{
                  id: crypto.randomUUID(),
                  content: initialMessage,
                  type: 'user',
                  timestamp
                }] 
              : [],
            createdAt: timestamp,
            updatedAt: timestamp,
          };
          
          set(state => ({
            chats: [newChat, ...state.chats],
            currentChatId: newChatId,
            hasCreatedFirstChat: true, // Mark that we've created the first chat
          }));
          
          return newChat;
        },
        
        // Add message to a chat
        addMessageToChat: (chatId, messageData) => {
          const { chats } = get();
          const chatIndex = chats.findIndex(chat => chat.id === chatId);
          
          if (chatIndex === -1) return;
          
          const newMessage: ChatMessage = {
            id: crypto.randomUUID(),
            ...messageData,
            timestamp: Date.now(),
          };
          
          const updatedChat = {
            ...chats[chatIndex],
            messages: [...chats[chatIndex].messages, newMessage],
            updatedAt: Date.now(),
          };
          
          set(state => ({
            chats: [
              updatedChat, // Move the updated chat to the top
              ...state.chats.slice(0, chatIndex),
              ...state.chats.slice(chatIndex + 1),
            ],
          }));
        },
        
        // Set current chat
        setCurrentChat: (chatId) => {
          set({ currentChatId: chatId });
        },
        
        // Delete a chat
        deleteChat: (chatId) => {
          set(state => ({
            chats: state.chats.filter(chat => chat.id !== chatId),
            currentChatId: state.currentChatId === chatId ? null : state.currentChatId,
          }));
        },
        
        // Update chat title
        updateChatTitle: (chatId, title) => {
          const { chats } = get();
          const chatIndex = chats.findIndex(chat => chat.id === chatId);
          
          if (chatIndex === -1) return;
          
          set(state => ({
            chats: [
              ...state.chats.slice(0, chatIndex),
              { ...state.chats[chatIndex], title, updatedAt: Date.now() },
              ...state.chats.slice(chatIndex + 1),
            ],
          }));
        },
        
        // Fetch chats from API
        fetchChats: async () => {
          set({ isLoading: true, error: null });
          
          try {
            // In a real app, you would fetch from your API
            // For now we'll just use the local state
            // const response = await fetch('/api/chats');
            // const data = await response.json();
            // set({ chats: data, isLoading: false });
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            set({ isLoading: false });
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'Failed to fetch chats' 
            });
          }
        },

        // Reset the chat creation flag
        resetChatCreationFlag: () => {
          set({ hasCreatedFirstChat: false });
        }
      }),
      {
        name: 'chat-history-storage',
        partialize: (state) => ({ 
          chats: state.chats, 
          currentChatId: state.currentChatId,
          hasCreatedFirstChat: state.hasCreatedFirstChat
        }),
      }
    )
  )
);

// Helper to get the current chat
export function useCurrentChat() {
  return useChatHistoryStore(state => {
    const { chats, currentChatId } = state;
    return currentChatId ? chats.find(chat => chat.id === currentChatId) || null : null;
  });
}

// Helper hook to navigate to a chat
export function useChatNavigation() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { createChat, setCurrentChat, currentChatId, hasCreatedFirstChat } = useChatHistoryStore();
  
  // Create a new chat and navigate to it (for authenticated users)
  const createAndNavigate = (title: string, initialMessage?: string) => {
    if (isSignedIn) {
      const newChat = createChat(title, initialMessage);
      router.push(`/c/${newChat.id}`);
      return newChat.id;
    }
    
    // For non-authenticated users, just create the chat in memory
    const newChat = createChat(title, initialMessage);
    return newChat.id;
  };
  
  return {
    createAndNavigate,
    currentChatId,
    hasCreatedFirstChat,
    navigateToChat: (chatId: string) => {
      setCurrentChat(chatId);
      if (isSignedIn) {
        router.push(`/c/${chatId}`);
      }
    }
  };
} 