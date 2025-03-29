import React, { useState } from "react";
import { 
  DownloadSimple, 
  Copy, 
  Share, 
  PencilSimple,
  ThumbsUp,
  ThumbsDown
} from "@phosphor-icons/react";
import { Button } from "@repo/design/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@repo/design/components/ui/tooltip";
import { CommandResult, CrawlResult } from "@/lib/store/resultsStore";
import { SummaryTile } from "./SummaryTile";
import { ContextPill } from "./ContextPill";

interface MessageItemProps {
  result: CommandResult;
  onCommand: (command: string) => void;
  onDownload?: (markdown: string, title: string) => void;
}

export function MessageItem({ result, onCommand, onDownload }: MessageItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  // Render different content based on result type
  const renderUrlContent = (content: CrawlResult) => {
    return (
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-lg text-foreground">{content.title || 'No title'}</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          <a 
            href={content.url} 
            target="_blank" 
            rel="noreferrer" 
            className="text-muted-foreground hover:text-foreground hover:underline transition-colors"
          >
            {content.url}
          </a>
        </p>
        
        {/* Context section for URL links */}
        {content.links && content.links.length > 0 && (
          <div className="mt-4 bg-muted/30 p-3 rounded-md border border-border/40">
            <p className="text-sm font-medium text-foreground mb-2">Context</p>
            <div className="flex flex-wrap gap-1">
              {content.links.slice(0, 5).map((link, i) => (
                <ContextPill 
                  key={i} 
                  text={new URL(link).hostname}
                  onClick={() => onCommand(`/url ${link}`)}
                />
              ))}
              {content.links.length > 5 && (
                <span className="text-xs text-muted-foreground px-2 py-1">
                  +{content.links.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSummaryContent = (content: any) => {
    return (
      <div>
        <h2 className="font-semibold text-lg text-foreground mb-3">{content.original.title || 'No title'}</h2>
        <p className="text-sm text-muted-foreground mb-3">
          <a 
            href={content.original.url} 
            target="_blank" 
            rel="noreferrer" 
            className="text-muted-foreground hover:text-foreground hover:underline transition-colors"
          >
            {content.original.url}
          </a>
        </p>
        
        {/* Summary section */}
        {content.summary && (
          <div className="mt-4 bg-muted/30 p-3 rounded-md border border-border/40">
            <p className="text-sm font-medium text-foreground mb-2">Summary</p>
            <SummaryTile summary={content.summary} />
          </div>
        )}
      </div>
    );
  };

  const renderChatContent = (content: any) => {
    return (
      <div>
        {/* User message shown as a bubble on the right with added bottom padding */}
        <div className="flex justify-end mb-6 group">
          <div className="relative max-w-[80%]">
            <div className="bg-muted/40 border border-border/40 rounded-2xl px-4 py-3 text-sm">
              <p className="text-foreground whitespace-pre-wrap">{content.question}</p>
            </div>
            
            {/* Edit button that appears on hover */}
            <div className="absolute -bottom-4 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full bg-background border border-border/40 shadow-sm"
                    onClick={() => {
                      // Set the input field to the current message for editing
                      navigator.clipboard.writeText(content.question);
                      // You could implement a proper editing mechanism here
                    }}
                  >
                    <PencilSimple weight="duotone" className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Edit</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
        
        {/* System response with no container */}
        <div 
          className="pl-1 mb-2"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="text-sm text-foreground whitespace-pre-wrap">
            {content.response}
          </div>
          
          {/* Action buttons */}
          <div className={`flex items-center gap-2 mt-2 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-full"
                  onClick={() => copyToClipboard(content.response)}
                >
                  <Copy weight="duotone" className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Copy</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-full"
                  onClick={() => onDownload && onDownload(content.response, "Response")}
                >
                  <DownloadSimple weight="duotone" className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Download</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-full"
                >
                  <Share weight="duotone" className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Share</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-full"
                >
                  <ThumbsUp weight="duotone" className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Helpful</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-full"
                >
                  <ThumbsDown weight="duotone" className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Not helpful</TooltipContent>
            </Tooltip>
          </div>
          
          {/* Context section (if available) */}
          {content.sourceUrl && (
            <div className="mt-4 bg-muted/30 p-3 rounded-md border border-border/40">
              <p className="text-sm font-medium text-foreground mb-2">Context</p>
              <a 
                href={content.sourceUrl} 
                className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
              >
                {content.sourceUrl}
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderErrorContent = (content: any) => {
    return (
      <div className="text-destructive">
        {typeof content === 'string' 
          ? content 
          : JSON.stringify(content, null, 2)}
      </div>
    );
  };

  const renderSpinOrThinkContent = (content: any) => {
    return (
      <div>
        {/* User message shown as a bubble on the right */}
        <div className="flex justify-end mb-6 group">
          <div className="relative max-w-[80%]">
            <div className="bg-muted/40 border border-border/40 rounded-2xl px-4 py-3 text-sm">
              <p className="text-foreground whitespace-pre-wrap">{content.question}</p>
            </div>
            
            {/* Edit button that appears on hover */}
            <div className="absolute -bottom-4 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full bg-background border border-border/40 shadow-sm"
                    onClick={() => {
                      // Set the input field to the current message for editing
                      navigator.clipboard.writeText(content.question);
                      // You could implement a proper editing mechanism here
                    }}
                  >
                    <PencilSimple weight="duotone" className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Edit</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
        
        {/* Response with no container */}
        <div 
          className="pl-1 mb-2"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="text-sm text-foreground whitespace-pre-wrap">
            {content.response}
          </div>
          
          {/* Action buttons */}
          <div className={`flex items-center gap-2 mt-2 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-full"
                  onClick={() => copyToClipboard(content.response)}
                >
                  <Copy weight="duotone" className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Copy</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-full"
                  onClick={() => onDownload && onDownload(content.response, "Response")}
                >
                  <DownloadSimple weight="duotone" className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Download</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-full"
                >
                  <Share weight="duotone" className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Share</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-full"
                >
                  <ThumbsUp weight="duotone" className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Helpful</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-full"
                >
                  <ThumbsDown weight="duotone" className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Not helpful</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  };

  // Determine which content renderer to use
  let content;
  switch (result.type) {
    case 'url':
      content = renderUrlContent(result.content as CrawlResult);
      break;
    case 'summary':
      content = renderSummaryContent(result.content);
      break;
    case 'chat':
      content = renderChatContent(result.content);
      break;
    case 'spin':
    case 'think':
      content = renderSpinOrThinkContent(result.content);
      break;
    case 'error':
      content = renderErrorContent(result.content);
      break;
    default:
      content = renderErrorContent(result.content);
  }

  return (
    <div className="mb-8">
      <div>{content}</div>
    </div>
  );
} 