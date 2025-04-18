import React, { useEffect } from "react";
import { X } from "@phosphor-icons/react";
import { useAtom } from "jotai";
import { settingsModalOpenAtom } from "@/src/store/settingsStore";
import { SettingsModal } from ".";
import { motion, AnimatePresence } from "framer-motion";

export function SettingsOverlay() {
  const [open, setOpen] = useAtom(settingsModalOpenAtom);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  // Function to close the overlay
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          className="fixed inset-0 z-[200] bg-background text-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header with close button */}
          <div className="flex items-center justify-between border-b p-3 sticky top-0 bg-background z-10">
            <h2 className="text-lg font-medium text-foreground">settings</h2>
            <button 
              onClick={handleClose}
              className="ml-2 h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent/50 text-foreground"
            >
              <X weight="duotone" className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          
          {/* Settings content */}
          <div className="flex-1 overflow-y-auto h-[calc(100vh-56px)]">
            <SettingsModal isMobile={true} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 