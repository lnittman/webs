import React from "react";

interface ToolResultMessageProps {
  content: any;
}

export function ToolResultMessage({ content }: ToolResultMessageProps) {
  return (
    <div className="px-6 py-2">
      <div className="ml-12 text-sm">
        <pre className="bg-muted/50 p-2 rounded-md whitespace-pre-wrap overflow-auto max-h-[400px] text-xs">
          {typeof content.result === 'object' 
            ? JSON.stringify(content.result, null, 2) 
            : content.result}
        </pre>
      </div>
    </div>
  );
} 