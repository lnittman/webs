import React, { useState } from 'react';
import { X } from '@phosphor-icons/react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@repo/design/components/ui/dialog";
import { Button } from "@repo/design/components/ui/button";

interface SummaryTileProps {
  summary: string;
}

export const SummaryTile: React.FC<SummaryTileProps> = ({ summary }) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Format summary text for display with markdown-like rendering
  const formatSummary = (text: string) => {
    // Process the text to handle markdown elements
    const processedText = text
      .split('\n')
      .map((line, i) => {
        // Handle headers
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-2xl font-bold mt-4 mb-2">{line.replace('# ', '')}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-xl font-bold mt-4 mb-2">{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-lg font-bold mt-3 mb-2">{line.replace('### ', '')}</h3>;
        }
        
        // Handle list items
        if (line.startsWith('- ')) {
          return <li key={i} className="ml-4 mb-1">{line.replace('- ', '')}</li>;
        }
        
        // Empty lines create spacing
        if (line.trim() === '') {
          return <div key={i} className="h-4"></div>;
        }
        
        // Regular text
        return <p key={i} className="mb-2">{line}</p>;
      });
    
    return <div className="prose prose-sm dark:prose-invert">{processedText}</div>;
  };

  return (
    <>
      <Button 
        onClick={() => setDialogOpen(true)}
        variant="outline"
        size="sm"
        className="mt-2"
      >
        View Summary
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Summary</DialogTitle>
            <DialogClose className="absolute right-4 top-4 opacity-70 hover:opacity-100">
              <X size={18} />
            </DialogClose>
          </DialogHeader>
          <div className="mt-4 max-w-none">
            {formatSummary(summary)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
