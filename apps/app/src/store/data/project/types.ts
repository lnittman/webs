/**
 * Project type definitions
 */

// ==============================
// Model types (server data structure)
// ==============================

/**
 * Project as stored in the database
 */
export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// ==============================
// UI state types (for store state)
// ==============================

/**
 * Project store state
 */
export interface ProjectState {
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

// ==============================
// Request/Response types (API contracts)
// ==============================

/**
 * Request to create a new project
 */
export interface CreateProjectRequest {
  name: string;
}

/**
 * Request to update a project
 */
export interface UpdateProjectRequest {
  name: string;
} 