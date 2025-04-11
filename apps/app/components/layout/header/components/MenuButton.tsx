"use client";

import React from "react";
import { List } from "@phosphor-icons/react";
import { Button } from "@repo/design/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@repo/design/hooks/use-mobile";
import { useSidebar } from "@/components/layout/sidebar/SidebarProvider";

export function MenuButton() {
  const { toggle } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "rounded-md text-foreground h-9 w-9 md:hidden flex items-center justify-center transition-all duration-200",
        "hover:bg-muted/50 hover:text-muted-foreground"
      )}
      aria-label="Toggle sidebar"
      onClick={toggle}
    >
      <List weight="duotone" className="h-5 w-5" />
    </Button>
  );
} 