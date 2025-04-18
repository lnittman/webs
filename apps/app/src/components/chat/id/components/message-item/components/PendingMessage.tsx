import React from "react";

interface PendingMessageProps {
  content: any;
}

export function PendingMessage({ content }: PendingMessageProps) {
  return (
    <div className="px-6 py-3">
      <div className="text-sm text-muted-foreground ml-12">
        <span className="italic">Thinking...</span>
      </div>
    </div>
  );
} 