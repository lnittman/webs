"use client";

import React from "react";
import Link from "next/link";
import { SignIn } from "@phosphor-icons/react";
import { useClerk, useAuth, useUser } from "@clerk/nextjs";
import { Button } from "@repo/design/components/ui/button";
import { Avatar, AvatarFallback } from "@repo/design/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/design/components/ui/dropdown-menu";

export function UserMenu() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  
  // Get user's initial for the avatar if signed in
  const userInitial = user?.firstName 
    ? user.firstName.charAt(0).toLowerCase()
    : user?.emailAddresses?.[0]?.emailAddress?.charAt(0).toLowerCase() || 'w';

  const handleSignOut = () => {
    signOut();
  };

  if (isSignedIn) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="relative h-8 w-8 rounded-full transition-all duration-200 hover:bg-muted/50">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild>
            <Link href="/settings" className="text-foreground">settings</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/help" className="text-foreground">help & feedback</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleSignOut} className="text-foreground">log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  return (
    <Button 
      className="rounded-full flex items-center h-9 px-4 text-xs font-medium bg-primary text-primary-foreground transition-colors duration-200 hover:bg-primary/90"
      asChild
    >
      <Link href="/signin">
        <SignIn weight="duotone" className="h-3.5 w-3.5" />
        <span>log in</span>
      </Link>
    </Button>
  );
} 