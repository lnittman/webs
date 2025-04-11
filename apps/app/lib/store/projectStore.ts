import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

// Request utility for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  return res.json();
};

// Define project interface
export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Define project store interface
interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProjects: () => Promise<void>;
  createProject: (name: string) => Promise<Project>;
  updateProject: (id: string, name: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (id: string | null) => void;
}

// Create the store
export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,
      isLoading: false,
      error: null,
      
      // Fetch projects from API
      fetchProjects: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/projects');
          
          if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.status}`);
          }
          
          const data = await response.json();
          set({ projects: data, isLoading: false });
        } catch (error) {
          console.error('[projectStore] Error fetching projects:', error);
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to fetch projects' 
          });
        }
      },
      
      // Create a new project
      createProject: async (name: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to create project: ${response.status}`);
          }
          
          const newProject = await response.json();
          
          // Add to projects list
          set(state => ({ 
            projects: [...state.projects, newProject],
            currentProjectId: newProject.id,
            isLoading: false 
          }));
          
          return newProject;
        } catch (error) {
          console.error('[projectStore] Error creating project:', error);
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to create project' 
          });
          throw error;
        }
      },
      
      // Set current project
      setCurrentProject: (id: string | null) => {
        set({ currentProjectId: id });
      },

      // Update a project via API
      updateProject: async (id: string, name: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/projects/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to update project: ${response.status}`);
          }
          
          const updatedProject = await response.json();
          
          // Update the project in the list
          set(state => ({
            projects: state.projects.map(project => 
              project.id === id ? updatedProject : project
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('[projectStore] Error updating project:', error);
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to update project' 
          });
          throw error;
        }
      },

      // Delete a project via API
      deleteProject: async (id: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/projects/${id}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            throw new Error(`Failed to delete project: ${response.status}`);
          }
          
          // Remove from projects list
          set(state => ({ 
            projects: state.projects.filter(project => project.id !== id),
            currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
            isLoading: false 
          }));
        } catch (error) {
          console.error('[projectStore] Error deleting project:', error);
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to delete project' 
          });
          throw error;
        }
      },
    }),
    {
      name: 'webs-projects', // storage key
      partialize: (state) => ({
        // Only persist these properties
        currentProjectId: state.currentProjectId
      }),
    }
  )
); 

/**
 * SWR hooks for fetching project data
 */

// Hook to fetch a single project
export function useProject(projectId: string | null) {
  return useSWR(
    projectId ? `/api/projects/${projectId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      suspense: false,
    }
  );
}

// Hook to fetch all projects
export function useProjects() {
  return useSWR(
    '/api/projects',
    fetcher,
    {
      revalidateOnFocus: false,
      suspense: false,
    }
  );
}

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