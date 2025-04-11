"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@repo/design/components/ui/button";
import { ArrowRight } from "@phosphor-icons/react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Code 404 */}
        <div className="mb-6">
          <div className="text-6xl text-muted-foreground/40 inline-block">
            404
          </div>
        </div>
        
        {/* Message */}
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl md:text-4xl font-title tracking-tight mb-4">not found</h1>
          <p className="text-muted-foreground">
            the page you're looking for doesn't exist...
          </p>
        </div>
        
        {/* Button */}
        <div className="flex justify-center">
          <Button asChild className="rounded-full h-10 px-6 text-sm">
            <Link href="/" className="flex items-center gap-2">
              <span>go to chat</span>
              <ArrowRight weight="bold" className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 