"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Chat } from "@/components/chat/id";
import { useProject } from "@/lib/store/projectStore";
import { useAuth } from "@clerk/nextjs";

export default function ProjectChatPage({ 
  params 
}: { 
  params: { projectId: string; chatId: string } 
}) {
  const { projectId, chatId } = params;
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { data: project } = useProject(projectId);
  
  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (isSignedIn === false) {
      router.push('/signin');
    }
  }, [isSignedIn, router]);
  
  // Check if project exists and user has access
  useEffect(() => {
    if (project && !project.isLoading && project.error) {
      // Project doesn't exist or user doesn't have access
      router.push('/');
    }
  }, [project, router]);
  
  if (project?.error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-semibold mb-4">Project not found</h1>
        <p className="text-muted-foreground mb-6">
          The project you're looking for doesn't exist or you don't have access to it.
        </p>
        <button 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          onClick={() => router.push('/')}
        >
          Back to Home
        </button>
      </div>
    );
  }
  
  // Simply render the Chat component with the chatId
  return <Chat chatId={chatId} />;
} 