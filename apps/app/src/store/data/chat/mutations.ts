import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useSWRConfig } from 'swr';
import { useAtom } from 'jotai';
import { initialMessageAtom } from '@/src/store/ui/input';
import { CreateChatRequest } from "./types";

// --- Navigation Hook (Handles API calls for creation) ---
export function useChatNavigation() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { mutate } = useSWRConfig(); // Get global mutate function
  const setInitialMessage = useAtom(initialMessageAtom)[1]; // Get only the setter function

  const createAndNavigate = async (title: string, initialMessageContent?: string, projectId?: string) => {
    if (!isSignedIn) {
      console.warn("[useChatNavigation] User not signed in. Cannot create chat on server.");
      router.push('/signin');
      return null;
    }

    console.log('[useChatNavigation] Creating chat via API:', { title, hasInitialMessage: !!initialMessageContent, projectId });
    try {
      const chatRequest: CreateChatRequest = { title, projectId };
      
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create chat: ${response.status}`);
      }

      const serverChat = await response.json();
      console.log('[useChatNavigation] Chat created via API:', serverChat);

      // Invalidate the chat list cache so the sidebar updates
      await mutate('/api/chats');

      // Store the initial message content temporarily before navigating
      if (initialMessageContent) {
        console.log('[useChatNavigation] Storing initial message for navigation:', initialMessageContent.substring(0,30));
        setInitialMessage(initialMessageContent);
      }

      // Navigate to the new chat
      const newChatId = serverChat.id;
      const path = projectId ? `/p/${projectId}/c/${newChatId}` : `/c/${newChatId}`;
      console.log(`[useChatNavigation] Navigating to: ${path}`);
      router.push(path);

      return newChatId; // Return the new ID

    } catch (error) {
      console.error('[useChatNavigation] Error creating chat via API:', error);
      setInitialMessage(null); // Clear temporary message on error
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