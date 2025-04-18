import React from "react";
import { FileArrowUp } from "@phosphor-icons/react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

import { cn } from "@/src/lib/utils";

export function UploadFileButton() {
  return (
    <DropdownMenuPrimitive.Item 
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors text-foreground",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
      )}
    >
      <FileArrowUp weight="duotone" className="h-4 w-4 mr-1.5" />
      <span>upload a file</span>
    </DropdownMenuPrimitive.Item>
  );
} 