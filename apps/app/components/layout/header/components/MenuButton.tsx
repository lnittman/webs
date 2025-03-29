"use client";

import React from "react";
import { List, DotsThree } from "@phosphor-icons/react";
import { useAtom } from "jotai";
import { mobileSheetOpenAtom, commandMenuOpenAtom } from "@/lib/store/settingsStore";
import { Button } from "@repo/design/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@repo/design/hooks/use-mobile";

export function MenuButton() {
  const [isSheetOpen, setIsSheetOpen] = useAtom(mobileSheetOpenAtom);
  const [commandOpen, setCommandOpen] = useAtom(commandMenuOpenAtom);
  const isMobile = useIsMobile();

  // Handle menu button click based on device type
  const handleMenuClick = () => {
    if (isMobile) {
      setIsSheetOpen(true);
    } else {
      setCommandOpen((prev) => !prev);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "rounded-full text-foreground h-9 w-9 flex items-center justify-center transition-all duration-200",
        "hover:bg-muted/50 hover:text-muted-foreground",
        !isMobile && "hover:bg-muted/50"
      )}
      aria-label="Menu"
      onClick={handleMenuClick}
    >
      <DotsThree weight="duotone" className="h-5 w-5" />
    </Button>
  );
} 