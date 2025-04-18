import React from "react";
import { ChatCircleText } from "@phosphor-icons/react";
import { Button } from "@repo/design/components/ui/button";

export function AddInstructions() {
  return (
    <div className="flex flex-col p-6 rounded-lg border border-border/50 hover:border-border hover:bg-accent/30 transition-colors">
      <div className="flex items-center mb-2">
        <ChatCircleText weight="duotone" className="h-5 w-5 mr-2 text-muted-foreground" />
        <h3 className="text-base font-medium text-foreground">add instructions</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        customize how the assistant responds in this project.
      </p>
      <Button className="w-full">set instructions</Button>
    </div>
  );
} 