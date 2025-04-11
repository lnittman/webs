import React from "react";

interface ContextSectionProps {
  sourceUrl: string;
}

export function ContextSection({ sourceUrl }: ContextSectionProps) {
  if (!sourceUrl) return null;

  return (
    <div className="mt-4 ml-12 bg-muted/30 p-3 rounded-md border border-border/40">
      <p className="text-sm font-medium text-foreground mb-2">Context</p>
      <a 
        href={sourceUrl} 
        className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
        target="_blank"
        rel="noreferrer"
      >
        {sourceUrl}
      </a>
    </div>
  );
} 