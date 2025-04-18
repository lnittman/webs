import useSWR from 'swr';
import { useAuth } from "@clerk/nextjs";
import { Chat } from "./types";

// SWR fetcher
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('An error occurred while fetching the data.');
  return res.json();
});

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