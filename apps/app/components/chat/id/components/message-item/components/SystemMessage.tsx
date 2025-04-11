import React, { useState } from "react";
import { DownloadSimple, Share, ThumbsUp, ThumbsDown, Copy, Check } from "@phosphor-icons/react";
import { Button } from "@repo/design/components/ui/button";
import { CustomTooltip } from "@/components/shared/CustomTooltip";
import { AnimatePresence, motion } from "framer-motion";

interface SystemMessageProps {
  content: string;
  onDownload: (content: string, title: string) => void;
}

export function SystemMessage({ content, onDownload }: SystemMessageProps) {
  const hasContent = !!content;
  const [isCopied, setIsCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    
    // Reset after 2 seconds
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <div className="mb-6 px-6">
      {/* System response content */}
      <div className="ml-12 text-sm text-foreground whitespace-pre-wrap break-all overflow-hidden" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>
        {content || <span className="text-muted-foreground italic">thinking...</span>}
      </div>
      
      {/* Action buttons */}
      {hasContent && (
        <div className="flex justify-end gap-2 mt-2 mr-2 transition-opacity duration-200 opacity-0 hover:opacity-100">
          <CustomTooltip content="Copy" side="bottom" hideOnCopy={true}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md bg-background border border-border/40 hover:bg-accent/50 flex items-center justify-center"
              onClick={handleCopy}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isCopied ? (
                  <motion.div
                    key="check"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-center"
                  >
                    <Check weight="duotone" className="h-4 w-4 text-green-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-center"
                  >
                    <Copy weight="duotone" className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </CustomTooltip>
          
          <CustomTooltip content="Download" side="bottom">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-md bg-background border border-border/40 hover:bg-accent/50 flex items-center justify-center"
              onClick={() => onDownload(content, "Response")}
            >
              <DownloadSimple weight="duotone" className="h-4 w-4" />
            </Button>
          </CustomTooltip>
          
          <CustomTooltip content="Share" side="bottom">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-md bg-background border border-border/40 hover:bg-accent/50 flex items-center justify-center"
            >
              <Share weight="duotone" className="h-4 w-4" />
            </Button>
          </CustomTooltip>
          
          <CustomTooltip content="Helpful" side="bottom">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-md bg-background border border-border/40 hover:bg-accent/50 flex items-center justify-center"
            >
              <ThumbsUp weight="duotone" className="h-4 w-4" />
            </Button>
          </CustomTooltip>
          
          <CustomTooltip content="Not Helpful" side="bottom">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-md bg-background border border-border/40 hover:bg-accent/50 flex items-center justify-center"
            >
              <ThumbsDown weight="duotone" className="h-4 w-4" />
            </Button>
          </CustomTooltip>
        </div>
      )}
    </div>
  );
} 