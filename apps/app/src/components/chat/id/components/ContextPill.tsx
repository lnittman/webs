import React from 'react';
import { X } from '@phosphor-icons/react';

import { cn } from '@/src/lib/utils';

import { Dialog, DialogContent, DialogClose } from "@repo/design/components/ui/dialog";

export interface ContextPillProps {
  text: string;
  onClick?: () => void;
  className?: string;
}

export const ContextPill: React.FC<ContextPillProps> = ({ 
  text, 
  onClick,
  className 
}) => {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "inline-block px-3 py-1 text-xs font-medium rounded-full border bg-background hover:bg-muted transition-colors",
        className
      )}
    >
      {text}
    </button>
  );
};

export interface ContextPillsGroupProps {
  links: Array<{
    id: string;
    url: string;
    title: string;
    description?: string;
    imageUrl?: string;
    type: 'article' | 'image' | 'video' | 'other';
  }>;
  onPillClick: (linkId: string) => void;
}

export const ContextPillsGroup: React.FC<ContextPillsGroupProps> = ({ 
  links,
  onPillClick
}) => {
  if (!links || links.length === 0) return null;
  
  return (
    <div className="mt-3 mb-4">
      <div className="text-xs text-muted-foreground mb-1">Context:</div>
      <div className="flex flex-wrap gap-1">
        {links.map(link => (
          <ContextPill 
            key={link.id}
            text={link.title || new URL(link.url).hostname}
            onClick={() => onPillClick(link.id)}
          />
        ))}
      </div>
    </div>
  );
};

export interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
  url?: string;
}

export const ContentModal: React.FC<ContentModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  url
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium">{title}</h2>
          <div className="flex items-center space-x-4">
            {url && (
              <a 
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Open
              </a>
            )}
            <DialogClose className="opacity-70 hover:opacity-100">
              <X size={18} />
            </DialogClose>
          </div>
        </div>
        <div className="mt-4">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
};
