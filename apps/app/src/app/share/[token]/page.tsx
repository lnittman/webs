"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/design/components/ui/button";
import { Checkbox } from "@repo/design/components/ui/checkbox";
import { Chat } from "@/components/chat/id";

interface SharedChatWarningProps {
  onProceed: () => void;
  onDismiss: (dontShowAgain: boolean) => void;
}

const SharedChatWarning = ({ onProceed, onDismiss }: SharedChatWarningProps) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleProceed = () => {
    onProceed();
    if (dontShowAgain) {
      onDismiss(dontShowAgain);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95">
      <div className="max-w-md w-full bg-card p-6 rounded-lg shadow-lg border border-border/50">
        <h2 className="text-xl font-semibold mb-2 text-foreground">This is a shared chat.</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Content of shared chats may contain unverified or potentially unsafe
          information that does not represent the views at Anthropic.
        </p>
        
        <div className="flex items-center space-x-2 mb-6">
          <Checkbox 
            id="dont-show-again" 
            checked={dontShowAgain}
            onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
          />
          <label 
            htmlFor="dont-show-again" 
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Don't show this message again
          </label>
        </div>
        
        <Button 
          onClick={handleProceed}
          className="w-full"
        >
          Show content
        </Button>
      </div>
    </div>
  );
};

export default function SharedChatPage({ params }: { params: { token: string } }) {
  const [showWarning, setShowWarning] = useState(true);
  const [chatData, setChatData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Fetch the shared chat data
  useEffect(() => {
    const fetchSharedChat = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/share/${params.token}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch shared chat');
        }
        
        const data = await response.json();
        setChatData(data);
        
        // If user has hideSharedWarning preference set to true, don't show warning
        if (data.currentUser?.hideSharedWarning) {
          setShowWarning(false);
        }
      } catch (err) {
        console.error('Error fetching shared chat:', err);
        setError((err as Error).message || 'Failed to load shared chat');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSharedChat();
  }, [params.token]);
  
  // Handle proceeding past the warning
  const handleProceed = () => {
    setShowWarning(false);
  };
  
  // Handle dismissing the warning
  const handleDismissWarning = async (dontShowAgain: boolean) => {
    // Only make the API call if user wants to dismiss permanently and is authenticated
    if (dontShowAgain && chatData?.currentUser) {
      try {
        const response = await fetch('/api/user/preferences', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            hideSharedWarning: true
          })
        });
        
        if (!response.ok) {
          console.error('Failed to update user preference');
        }
      } catch (error) {
        console.error('Error updating user preference:', error);
      }
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-primary"></div>
        <p className="mt-3 text-sm text-muted-foreground">Loading shared chat...</p>
      </div>
    );
  }

  // Render error state
  if (error || !chatData) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-medium mb-2">Unable to load shared chat</h1>
          <p className="text-sm text-muted-foreground mb-4">
            {error || "This shared chat may have expired or been removed."}
          </p>
          <Button onClick={() => router.push('/')}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {showWarning && (
        <SharedChatWarning 
          onProceed={handleProceed} 
          onDismiss={handleDismissWarning} 
        />
      )}
      {!showWarning && chatData && (
        <div className="relative">
          {chatData.expiresAt && (
            <div className="absolute top-4 right-4 z-10 bg-accent/80 px-3 py-1 rounded text-xs text-foreground">
              Expires: {new Date(chatData.expiresAt).toLocaleDateString()}
            </div>
          )}
          <Chat 
            chatId={chatData.chat.id} 
            isSharedView={true}
            initialMessages={chatData.chat.messages} 
            readOnly={true}
          />
        </div>
      )}
    </>
  );
} 