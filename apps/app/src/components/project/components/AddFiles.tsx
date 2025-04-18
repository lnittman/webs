import React from "react";
import { FileArrowUp } from "@phosphor-icons/react";
import { Button } from "@repo/design/components/ui/button";

export function AddFiles() {
  return (
    <div className="flex flex-col p-6 rounded-lg border border-border/50 hover:border-border hover:bg-accent/30 transition-colors">
      <div className="flex items-center mb-2">
        <FileArrowUp weight="duotone" className="h-5 w-5 mr-2 text-muted-foreground" />
        <h3 className="text-base font-medium text-foreground">add files</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        upload files to provide context for your project chats.
      </p>
      <Button className="w-full">upload files</Button>
    </div>
  );
} 