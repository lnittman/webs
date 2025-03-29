/**
 * Agents API service - handles interactions with all agents endpoints
 */

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
export async function fetchAgentResponse(input: {
  mode: 'main' | 'spin' | 'think';
  url?: string;
  query?: string;
  prompt?: string;
  maxDepth?: number;
  feedbackEnabled?: boolean;
  stream?: boolean;
}) {
  // Determine the endpoint based on the mode
  const endpoint = `${BASE_URL}/${input.mode}`;
  
  // Prepare request payload based on the mode
  let payload: any = {
    ...input,
    // Omit the mode as it's already in the endpoint
    mode: undefined
  };
  
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

// Main agent functions - non-streaming version (legacy)
export async function fetchMainResponse(input: { url?: string; query?: string; stream?: boolean }) {
  return fetchAgentResponse({
    mode: 'main',
    ...input
  });
}

// Main agent streaming configuration
export function streamMainResponse(input: { url?: string; query?: string }) {
  return streamAgentResponse({
    mode: 'main',
    ...input
  });
}

// Spin agent functions
export async function fetchSpinResponse(input: { 
  prompt?: string; 
  maxDepth?: number;
}) {
  return fetchAgentResponse({
    mode: 'spin',
    ...input
  });
}

// Think agent functions
export async function fetchThinkResponse(input: {
  prompt: string;
  maxDepth?: number;
  feedbackEnabled?: boolean;
}) {
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
export function streamAgentResponse(input: {
  mode: 'main' | 'spin' | 'think';
  url?: string;
  query?: string;
  prompt?: string;
  urls?: string[];
  maxDepth?: number;
  feedbackEnabled?: boolean;
}) {
  // Special case for main mode - use dedicated endpoint
  if (input.mode === 'main') {
    // Return the URL and request options for streaming
    const url = `${BASE_URL}/main`;
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: input.url,
        query: input.query,
        stream: true
      }),
    };
    
    return { url, options };
  }
  
  // Use the generic stream endpoint for other modes
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