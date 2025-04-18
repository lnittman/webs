"use client";

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { FolderSimple, Plus } from '@phosphor-icons/react';

import { useMediaQuery } from '@repo/design/hooks/use-media-query';

import { cn } from '@/src/lib/utils';
import { useProjects } from '@/src/store/data/project';

import { useSidebar } from '../SidebarProvider';
import { ChatItemMenu } from '../../shared/ChatItemMenu';

interface ProjectsSectionProps {
  setProjectModalOpen: (value: boolean) => void;
}

export function ProjectsSection({ setProjectModalOpen }: ProjectsSectionProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const pathname = usePathname();
  const router = useRouter();

  const { data: projects } = useProjects();
  const { toggle } = useSidebar();
  
  // Use API projects if available, or fall back to empty array
  const projectsList = projects || [];
  
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between py-1">
        <span className="text-xs text-muted-foreground">projects</span>
        
        {/* Only show + button if projects exist */}
        {projectsList.length > 0 && (
          <button
            onClick={() => setProjectModalOpen(true)}
            className="h-5 w-5 flex items-center justify-center rounded-sm hover:bg-accent/50 transition-colors"
            aria-label="New project"
          >
            <Plus weight="duotone" className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>
      
      {/* Project list or new project button */}
      {projectsList.length === 0 ? (
        <div className="group relative">
          <div
            onClick={() => setProjectModalOpen(true)}
            className="flex items-center py-2 px-2 w-full min-h-[36px] hover:bg-accent/50 transition-colors rounded-md text-left cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setProjectModalOpen(true)}
          >
            <FolderSimple weight="duotone" className="h-4 w-4 text-muted-foreground" />
            <span className="ml-2 text-sm truncate text-muted-foreground flex-1 leading-normal">new project</span>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {projectsList.map((project: any) => (
            <div key={project.id} className="group relative">
              <div
                onClick={() => {
                  router.push(`/p/${project.id}`);
                  if (!isDesktop) toggle();
                }}
                className={cn(
                  "flex items-center py-2 px-2 w-full min-h-[36px] hover:bg-accent/50 transition-colors rounded-md text-left cursor-pointer",
                  pathname.includes(`/p/${project.id}`) ? "bg-accent/70" : ""
                )}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    router.push(`/p/${project.id}`);
                    if (!isDesktop) toggle();
                  }
                }}
              >
                <FolderSimple weight="duotone" className="h-4 w-4 text-muted-foreground" />
                <span className="ml-2 text-sm truncate text-foreground flex-1 leading-normal">{project.name}</span>
                <span className="relative z-10">
                  <ChatItemMenu chatId={project.id} isProject={true} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 