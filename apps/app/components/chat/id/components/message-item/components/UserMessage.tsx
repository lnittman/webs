import React, { useState } from "react";
import { Copy, Check } from "@phosphor-icons/react";
import { Button } from "@repo/design/components/ui/button";
import { CustomTooltip } from "@/components/shared/CustomTooltip";
import { AnimatePresence, motion } from "framer-motion";

interface UserMessageProps {
  userInitials: string;
  content: string;
}

export function UserMessage({ userInitials, content }: UserMessageProps) {
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
    <div className="mb-6 group">
      {/* Message container with full width */}
      <div className="bg-muted/40 border border-border/40 rounded-xl py-3 w-full relative">
        {/* Use flex with align-start to keep avatar at the top */}
        <div className="flex items-start">
          {/* User Avatar - aligned to the top left */}
          <div className="h-8 w-8 rounded-full bg-background border border-border text-foreground flex items-center justify-center text-xs font-medium flex-shrink-0 ml-6 mr-4 mt-0.5">
            {userInitials}
          </div>
          
          {/* Message content - full width, no vertical padding */}
          <div className="pt-2 pr-10 flex-1 text-sm">
            <p className="text-foreground whitespace-pre-wrap break-all overflow-hidden" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>
              {content}
            </p>
          </div>
        </div>
        
        {/* Message action buttons that appear below message with padding */}
        <div className="flex justify-end mt-2 mr-6 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
                    <Check weight="duotone" className="h-3.5 w-3.5 text-green-500" />
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
                    <Copy weight="duotone" className="h-3.5 w-3.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </CustomTooltip>
        </div>
      </div>
    </div>
  );
} 