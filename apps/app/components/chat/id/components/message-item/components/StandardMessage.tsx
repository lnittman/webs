import React from "react";
import { UserMessage } from "./UserMessage";
import { SystemMessage } from "./SystemMessage";
import { ContextSection } from "./ContextSection";

interface StandardMessageProps {
  content: any;
  userInitials: string;
  onDownload: (content: string, title: string) => void;
}

export function StandardMessage({ 
  content, 
  userInitials, 
  onDownload 
}: StandardMessageProps) {
  // Validate content structure
  if (!content) {
    console.error('[StandardMessage] Content is null or undefined');
    return <div className="text-destructive">Error: Empty content</div>;
  }

  // Check if question and response exist
  const hasQuestion = !!content.question;
  const hasResponse = content.response !== undefined;
  
  if (!hasQuestion && !hasResponse) {
    console.error('[StandardMessage] Invalid content structure', content);
    return (
      <div className="text-destructive">
        Error: Invalid content structure
        <pre className="mt-2 text-xs">{JSON.stringify(content, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div>
      {hasQuestion && (
        <UserMessage 
          userInitials={userInitials}
          content={content.question}
        />
      )}
      
      <SystemMessage 
        content={content.response}
        onDownload={onDownload}
      />
      
      {content.sourceUrl && (
        <ContextSection sourceUrl={content.sourceUrl} />
      )}
    </div>
  );
} 