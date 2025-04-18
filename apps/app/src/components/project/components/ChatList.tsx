import React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ChatCircleDots } from "@phosphor-icons/react";

import { ChatItemMenu } from "@/src/components/shared/ChatItemMenu";

interface ChatListProps {
  projectId: string;
  chats: any[];
}

export function ChatList({ projectId, chats }: ChatListProps) {
  return (
    <div className="mb-10">
      {/* Chat List */}
      <div className="space-y-1.5">
        {chats && chats.length > 0 ? (
          chats.map(chat => (
            <Link
              key={chat.id}
              href={`/p/${projectId}/c/${chat.id}`}
              className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">{chat.title}</p>
                <p className="text-xs text-muted-foreground">
                  {chat.updatedAt ? formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true }) : 'just now'}
                </p>
              </div>
              <ChatItemMenu chatId={chat.id} />
            </Link>
          ))
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center mb-4">
              <ChatCircleDots weight="duotone" className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-foreground text-base font-medium mb-2">no chats yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              ask a question in the command bar above to start a new conversation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
