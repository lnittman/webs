"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  DotsThree, 
  FolderSimple, 
  Archive, 
  Trash, 
  PencilSimple, 
  Share,
  UserPlus 
} from "@phosphor-icons/react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/src/lib/utils";
import { useChats, useChatData } from "@/src/store/data/chat";
import { DeleteChatModal } from "../layout/modal/DeleteChatModal";
import { RenameChatModal } from "../layout/modal/RenameChatModal";
import { ShareChatModal } from "../layout/modal/ShareChatModal";
import { InviteUserModal } from "../layout/modal/InviteUserModal";
import { AnimatePresence, motion } from "framer-motion";

interface ChatItemMenuProps {
  chatId: string;
  isProject?: boolean;
}

export function ChatItemMenu({ chatId, isProject = false }: ChatItemMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const router = useRouter();
  const { mutateChats } = useChats();
  const { chatData } = useChatData(showDeleteModal || showRenameModal || showShareModal || showInviteModal ? chatId : null);

  const handleAddToProject = (e: React.MouseEvent | Event) => {
    // Prevent event from propagating to parent elements
    e.stopPropagation();
    
    console.log("Add to project:", chatId);
    setIsOpen(false);
  };

  const handleRename = (e: React.MouseEvent | Event) => {
    // Prevent event from propagating to parent elements
    e.stopPropagation();
    
    setShowRenameModal(true);
    setIsOpen(false);
  };

  const handleShare = (e: React.MouseEvent | Event) => {
    // Prevent event from propagating to parent elements
    e.stopPropagation();
    
    setShowShareModal(true);
    setIsOpen(false);
  };

  const handleInvite = (e: React.MouseEvent | Event) => {
    // Prevent event from propagating to parent elements
    e.stopPropagation();
    
    setShowInviteModal(true);
    setIsOpen(false);
  };

  const handleArchive = (e: React.MouseEvent | Event) => {
    // Prevent event from propagating to parent elements
    e.stopPropagation();
    
    console.log("Archive:", chatId);
    setIsOpen(false);
  };

  const handleShowDeleteConfirmation = (e: React.MouseEvent | Event) => {
    // Prevent event from propagating to parent elements
    e.stopPropagation();
    
    setShowDeleteModal(true);
    setIsOpen(false); // Close the dropdown
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      // Call the DELETE API endpoint
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete chat');
      }
      
      // Close the modal
      setShowDeleteModal(false);
      
      // Invalidate the SWR cache to refresh the chat list
      await mutateChats();
      
      // If we're on the deleted chat's page, redirect to home
      if (window.location.pathname.includes(`/c/${chatId}`)) {
        router.push('/');
      }
      
      console.log("Chat deleted successfully:", chatId);
    } catch (error) {
      console.error("Error deleting chat:", error);
      // Here you would typically show a toast error notification
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRenameSubmit = async (newTitle: string) => {
    try {
      setIsRenaming(true);
      
      // Call the update API endpoint
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to rename chat');
      }
      
      // Close the modal
      setShowRenameModal(false);
      
      // Invalidate the SWR cache to refresh the chat list
      await mutateChats();
      
      console.log("Chat renamed successfully:", chatId);
    } catch (error) {
      console.error("Error renaming chat:", error);
      // Here you would typically show a toast error notification
    } finally {
      setIsRenaming(false);
    }
  };

  // Handle trigger click to prevent navigation in Link elements
  const handleTriggerClick = (e: React.MouseEvent) => {
    // Only stop propagation to prevent the chat from being selected
    e.stopPropagation();
  };

  return (
    <div 
      onClick={(e) => {
        // Only stop propagation, don't prevent default
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        // Only stop propagation, don't prevent default
        e.stopPropagation();
      }}
      className="relative"
    >
      <DropdownMenuPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuPrimitive.Trigger asChild>
          <button
            onClick={handleTriggerClick}
            onMouseDown={(e) => e.stopPropagation()}
            className={cn(
              "h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-accent/50 hover:text-foreground",
              isOpen 
                ? "opacity-100 bg-accent/50 text-foreground" 
                : "opacity-0 group-hover:opacity-100"
            )}
            aria-label="Chat options"
          >
            <DotsThree weight="duotone" className="h-5 w-5" />
          </button>
        </DropdownMenuPrimitive.Trigger>
        
        <AnimatePresence>
          {isOpen && (
            <DropdownMenuPrimitive.Portal forceMount>
              <DropdownMenuPrimitive.Content
                asChild
                side="right" 
                align="start"
                sideOffset={4}
              >
                <motion.div
                  className={cn(
                    "z-50 min-w-[160px] overflow-hidden rounded-xl border border-border/20 bg-popover/95 backdrop-blur-sm p-1.5 shadow-xl"
                  )}
                  initial={{ opacity: 0, scale: 0.95, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95, x: -10 }}
                  transition={{ 
                    duration: 0.2,
                    ease: [0.32, 0.72, 0, 1]
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {!isProject && (
                    <DropdownMenuPrimitive.Item 
                      onSelect={(e) => {
                        // Stop propagation to prevent chat selection but don't prevent dropdown closing
                        handleAddToProject(e);
                      }}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors text-foreground",
                        "focus:bg-accent focus:text-accent-foreground",
                        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      )}
                    >
                      <FolderSimple weight="duotone" className="h-4 w-4 mr-1.5" />
                      <span>add to project</span>
                    </DropdownMenuPrimitive.Item>
                  )}
                  <DropdownMenuPrimitive.Item 
                    onSelect={(e) => {
                      // Stop propagation to prevent chat selection but don't prevent dropdown closing
                      handleRename(e);
                    }}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors text-foreground",
                      "focus:bg-accent focus:text-accent-foreground",
                      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    )}
                  >
                    <PencilSimple weight="duotone" className="h-4 w-4 mr-1.5" />
                    <span>rename</span>
                  </DropdownMenuPrimitive.Item>
                  <DropdownMenuPrimitive.Item 
                    onSelect={(e) => {
                      // Stop propagation to prevent chat selection but don't prevent dropdown closing
                      handleShare(e);
                    }}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors text-foreground",
                      "focus:bg-accent focus:text-accent-foreground",
                      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    )}
                  >
                    <Share weight="duotone" className="h-4 w-4 mr-1.5" />
                    <span>share</span>
                  </DropdownMenuPrimitive.Item>
                  <DropdownMenuPrimitive.Item 
                    onSelect={(e) => {
                      // Stop propagation to prevent chat selection but don't prevent dropdown closing
                      handleInvite(e);
                    }}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors text-foreground",
                      "focus:bg-accent focus:text-accent-foreground",
                      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    )}
                  >
                    <UserPlus weight="duotone" className="h-4 w-4 mr-1.5" />
                    <span>invite</span>
                  </DropdownMenuPrimitive.Item>
                  <DropdownMenuPrimitive.Item 
                    onSelect={(e) => {
                      // Stop propagation to prevent chat selection but don't prevent dropdown closing
                      handleArchive(e);
                    }}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors text-foreground",
                      "focus:bg-accent focus:text-accent-foreground",
                      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    )}
                  >
                    <Archive weight="duotone" className="h-4 w-4 mr-1.5" />
                    <span>archive</span>
                  </DropdownMenuPrimitive.Item>
                  <DropdownMenuPrimitive.Separator className="my-1 h-px bg-border/20" />
                  <DropdownMenuPrimitive.Item 
                    onSelect={(e) => {
                      // Stop propagation to prevent chat selection but don't prevent dropdown closing
                      handleShowDeleteConfirmation(e);
                    }}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors text-red-500",
                      "focus:bg-accent focus:text-accent-foreground",
                      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    )}
                  >
                    <Trash weight="duotone" className="h-4 w-4 mr-1.5 text-red-500" />
                    <span>delete</span>
                  </DropdownMenuPrimitive.Item>
                </motion.div>
              </DropdownMenuPrimitive.Content>
            </DropdownMenuPrimitive.Portal>
          )}
        </AnimatePresence>
      </DropdownMenuPrimitive.Root>

      {/* Delete Confirmation Modal */}
      <DeleteChatModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        chatTitle={chatData?.title || 'this chat'}
      />

      {/* Rename Chat Modal */}
      <RenameChatModal
        isOpen={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        onRename={handleRenameSubmit}
        isRenaming={isRenaming}
        initialTitle={chatData?.title || ''}
      />

      {/* Share Chat Modal */}
      <ShareChatModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        chatId={chatId}
        chatTitle={chatData?.title || 'Untitled Chat'}
      />

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        chatId={chatId}
        chatTitle={chatData?.title || 'Untitled Chat'}
      />
    </div>
  );
} 