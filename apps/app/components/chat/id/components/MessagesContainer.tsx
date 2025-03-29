import React from "react";
import { MessageItem } from "./MessageItem";
import { CommandResult } from "@/lib/store/resultsStore";

interface MessagesContainerProps {
  results: CommandResult[];
  onCommand: (command: string) => void;
  userName?: string | null;
}

export function MessagesContainer({ results, onCommand, userName }: MessagesContainerProps) {
  // Utility function for downloading markdown
  const downloadMarkdown = (markdown: string, title: string) => {
    const element = document.createElement("a");
    const file = new Blob([markdown], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${title.replace(/\s+/g, '_').toLowerCase()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // No need to render the container if there are no results
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-4">
      <div className="space-y-8">
        {results.map((result, index) => (
          <MessageItem
            key={index}
            result={result}
            onCommand={onCommand}
            onDownload={downloadMarkdown}
          />
        ))}
      </div>
      
      {/* Add a bit of padding at the bottom to ensure content doesn't get cut off */}
      <div className="h-12" />
    </div>
  );
}
