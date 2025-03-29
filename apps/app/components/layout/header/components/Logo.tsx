"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@repo/design/components/ui/button";
import { useRouter } from "next/navigation";
import { Leaf } from "@phosphor-icons/react";

export function Logo() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      onClick={() => router.push("/")}
      size="icon"
      className="flex items-center justify-center h-9 px-3 gap-1.5 rounded-full transition-colors duration-200 
      text-primary border border-primary/20 hover:border-primary/10 hover:bg-muted/50 hover:text-primary/80
      active:bg-primary/10 active:text-primary/80 active:border-primary/30 active:text-primary/60
      touch-action-manipulation tap-highlight-transparent -webkit-tap-highlight-color-transparent"
      aria-label="Go to home page"
    >
      <Leaf weight="duotone" className="h-5 w-5" />
      <span className="font-medium text-lg">webs</span>
    </Button>
  );
} 