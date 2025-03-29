import React from "react";
import { CommandBar } from "../components/CommandBar";
import { Greeting } from "./components/Greeting";
import { RecentChatsGrid } from "./components/recent-chat-grid";
import { YouAgree } from "@/components/layout/YouAgree";
import { useResultsStore } from "@/lib/store/resultsStore";
import { useAtom } from "jotai";
import { addToCommandHistoryAtom, commandInputAtom } from "@/lib/store/settingsStore";
import { useUser, useAuth } from "@clerk/nextjs";
import { useChatNavigation } from "@/lib/store/chatHistoryStore";
import { useRouter } from "next/navigation";
import { isUrl } from "@repo/agents/src/hooks";

// Import or create a PresetMenuGrid component
// This is a placeholder - we'll create this component next
import { PresetMenuGrid } from "./components/preset-menu-grid";

interface NewChatProps {
  userName?: string | null;
}

export function NewChat({ userName }: NewChatProps) {
  const { isLoading, setIsLoading, addResult } = useResultsStore();
  const [_, addToCommandHistory] = useAtom(addToCommandHistoryAtom);
  const [input, setInput] = useAtom(commandInputAtom);
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const { createAndNavigate } = useChatNavigation();
  const router = useRouter();

  const handleCommand = async (command: string, options?: { mode?: 'main' | 'spin' | 'think' }) => {
    if (isLoading) return;
    
    // Add to command history
    addToCommandHistory(command);
    
    // Get the mode from options
    const mode = options?.mode || 'main';
    
    // Check if the input is a URL
    const isUrlInput = isUrl(command);
    console.log(`[NewChat] Command: "${command.substring(0, 30)}${command.length > 30 ? '...' : ''}" (isUrl: ${isUrlInput})`);
    
    // Start loading
    setIsLoading(true);
    
    try {
      const chatTitle = command.substring(0, 30) + (command.length > 30 ? '...' : '');
      const chatId = createAndNavigate(chatTitle, command);
      
      // Only navigate if the user is signed in
      if (isSignedIn && chatId) {
        // Build query params for chat page
        const params = new URLSearchParams();
        
        // Add mode if it's not the default
        if (mode !== 'main') {
          params.append('mode', mode);
        }
        
        // Add URL type if it's a URL
        if (isUrlInput) {
          params.append('type', 'url');
        }
        
        // Navigate with query params
        const queryString = params.toString();
        const url = `/c/${chatId}${queryString ? `?${queryString}` : ''}`;
        console.log(`[NewChat] Navigating to: ${url}`);
        router.push(url);
      } else {
        // For non-authenticated users, we're done creating the chat
        console.log(`[NewChat] User not signed in, no navigation needed`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error(`[NewChat] Error creating chat:`, error);
      setIsLoading(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (fullCommand: string) => {
    // Set the input with the full command
    setInput(fullCommand);
    
    // Focus the command bar input after selection
    setTimeout(() => {
      const inputElement = document.getElementById('command-input');
      if (inputElement) {
        inputElement.focus();
        // Position cursor at the end
        const inputField = inputElement as HTMLTextAreaElement;
        const length = inputField.value.length;
        inputField.setSelectionRange(length, length);
      }
    }, 350);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-background text-foreground blur-container">
      <div className="flex flex-col flex-grow w-full max-w-3xl mx-auto px-4 pb-4 relative">
        {/* Greeting */}
        <div className="my-12">
          <Greeting userName={user?.firstName ?? userName} />
        </div>
        
        {/* Command Bar and grids */}
        <div className="sticky bottom-0 pt-4 pb-8 bg-gradient-to-t from-background via-background to-background/95 w-full">
          {/* Command Bar */}
          <CommandBar onCommand={handleCommand} isLoading={isLoading} />
          
          {/* YouAgree component at the bottom */}
          <div className="fixed bottom-0 left-0 right-0 pb-4">
            <YouAgree />
          </div>
        </div>
      </div>
    </div>
  );
} 