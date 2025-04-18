import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, ProjectState, CreateProjectRequest, UpdateProjectRequest } from './types';

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
          const projectRequest: CreateProjectRequest = { name };
          
          const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(projectRequest),
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
          const updateRequest: UpdateProjectRequest = { name };
          
          const response = await fetch(`/api/projects/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateRequest),
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