/**
 * Agents API service - handles interactions with all agents endpoints
 */

// Define type for agent modes
export type AgentMode = 'main' | 'spin' | 'think';

// Define base agent request types
export interface BaseAgentRequest {
  mode: AgentMode;
  prompt: string;
  stream?: boolean;
}

export interface MainAgentRequest extends BaseAgentRequest {
  mode: 'main';
  maxDepth?: number;
}

export interface ThinkAgentRequest extends BaseAgentRequest {
  mode: 'think';
  maxDepth?: number;
  feedbackEnabled?: boolean;
}

export interface SpinAgentRequest extends BaseAgentRequest {
  mode: 'spin';
  maxDepth?: number;
}

// Union type of all possible agent requests
export type AgentRequest = MainAgentRequest | ThinkAgentRequest | SpinAgentRequest;

// Base URL for agents API
const BASE_URL = '/api/agents';

// Generic fetch with error handling
async function fetchWithErrorHandling(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Agents API error:', error);
    throw error;
  }
}

// Unified function to fetch responses from any agent type
export async function fetchAgentResponse(input: AgentRequest) {
  // All requests now go to the stream endpoint
  const endpoint = `${BASE_URL}/stream`;
  
  // Clone and prepare request payload
  const payload = { ...input };
  
  // Default stream to false if not specified
  if (payload.stream === undefined) {
    payload.stream = false;
  }
  
  return fetchWithErrorHandling(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// Convenience functions for different agent types
export function fetchMainResponse(input: { prompt: string; maxDepth?: number; stream?: boolean }) {
  return fetchAgentResponse({
    mode: 'main',
    ...input
  });
}

export function fetchSpinResponse(input: { prompt: string; maxDepth?: number; stream?: boolean }) {
  return fetchAgentResponse({
    mode: 'spin',
    ...input
  });
}

export function fetchThinkResponse(input: { prompt: string; maxDepth?: number; feedbackEnabled?: boolean; stream?: boolean }) {
  return fetchAgentResponse({
    mode: 'think',
    ...input
  });
}

// Submit feedback for Think agent
export async function submitFeedback(input: {
  threadId: string;
  feedback: string;
}) {
  return fetchWithErrorHandling(`${BASE_URL}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

// Unified function to create streaming configuration for any agent
export function streamAgentResponse(input: AgentRequest) {
  // All requests go to the stream endpoint
  const url = `${BASE_URL}/stream`;
  
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  };
  
  return { url, options };
}

// Fetch the raw content of a URL (using the current crawl endpoint)
export async function fetchUrlContent(url: string) {
  return fetchWithErrorHandling('/api/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
} 