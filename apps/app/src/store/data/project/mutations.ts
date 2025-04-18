import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useProjectStore } from './store';

/**
 * Hook for project navigation
 */
export function useProjectNavigation() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { createProject, setCurrentProject, currentProjectId } = useProjectStore();
  
  // Create a new project and navigate to it
  const createAndNavigate = async (name: string) => {
    const newProject = await createProject(name);
    
    if (isSignedIn) {
      router.push(`/projects/${newProject.id}`);
    }
    
    return newProject.id;
  };
  
  return {
    createAndNavigate,
    currentProjectId,
    navigateToProject: (projectId: string) => {
      // Set current project
      setCurrentProject(projectId);
      
      // Then navigate if user is signed in
      if (isSignedIn) {
        router.push(`/projects/${projectId}`);
      }
    }
  };
} 