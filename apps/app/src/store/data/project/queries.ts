import useSWR from 'swr';
import { Project } from './types';

// Request utility for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  return res.json();
};

/**
 * SWR hooks for fetching project data
 */

// Hook to fetch a single project
export function useProject(projectId: string | null) {
  return useSWR<Project>(
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
  return useSWR<Project[]>(
    '/api/projects',
    fetcher,
    {
      revalidateOnFocus: false,
      suspense: false,
    }
  );
} 