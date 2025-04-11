import React from "react";
import { motion } from "framer-motion";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

interface LanguageMenuProps {
  // Define props if needed, e.g., for selected language and setter
  // selectedLanguage: string;
  // onSelectLanguage: (language: string) => void;
}

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  // Add more languages as needed
];

// Dummy state for demonstration
const selectedLanguage = "en";
const onSelectLanguage = (lang: string) => console.log("Selected:", lang);

export function LanguageMenu({}: LanguageMenuProps) {
  return (
    <DropdownMenuPrimitive.SubContent
      asChild
      sideOffset={-4} // Align with main menu edge
      alignOffset={-5} // Slight overlap
      className={cn(
        "z-50 min-w-[180px] overflow-hidden rounded-lg border border-border/20 bg-popover/95 backdrop-blur-sm p-1.5 shadow-xl",
        "data-[side=right]:origin-left data-[side=left]:origin-right"
      )}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, x: -5 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95, x: -5 }}
        transition={{
          duration: 0.2,
          ease: [0.32, 0.72, 0, 1]
        }}
      >
        <p className="px-2 py-1 text-xs text-muted-foreground">Select Language</p>
        {languages.map((lang) => (
          <DropdownMenuPrimitive.Item
            key={lang.code}
            onSelect={() => onSelectLanguage(lang.code)}
            className={cn(
              "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors text-foreground",
              "focus:bg-accent focus:text-accent-foreground",
              "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            )}
          >
            <span className="flex-1">{lang.name}</span>
            {selectedLanguage === lang.code && (
              <Check className="w-4 h-4 ml-2 text-primary" weight="bold" />
            )}
          </DropdownMenuPrimitive.Item>
        ))}
      </motion.div>
    </DropdownMenuPrimitive.SubContent>
  );
}