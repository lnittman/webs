import { useState, useCallback, useEffect, useRef } from 'react';

export type AgentMode = 'main' | 'spin' | 'think';

export interface StreamRequest {
  mode: AgentMode;
  prompt: string;
  maxDepth?: number;
  feedbackEnabled?: boolean;
  threadId?: string;
  resourceId?: string;
}

export interface StreamState {
  isStreaming: boolean;
  streamingContent: string;
  streamingCommand: string;
  error: string | null;
  isDone: boolean;
  threadId?: string;
  resourceId?: string;
  requestId?: string;
}

export interface StreamResult extends StreamState {
  startStreaming: (request: StreamRequest, command: string) => Promise<void>;
  appendStreamingContent: (content: string) => void;
  finishStreaming: () => void;
  resetStream: () => void;
  abortStream: () => void;
}

interface StreamChunk {
  chunk?: string;
  done?: boolean;
  error?: string;
  progress?: string;
  step?: string;
  timestamp?: number;
  threadId?: string;
  resourceId?: string;
  requestId?: string;
}

/**
 * Hook for managing agent streaming state and operations
 */
export function useAgentStream(baseUrl: string = '/api/agents'): StreamResult {
  // Stream state
  const [streamState, setStreamState] = useState<StreamState>({
    isStreaming: false,
    streamingContent: '',
    streamingCommand: '',
    error: null,
    isDone: false,
  });
  
  // Track current request ID
  const [requestId, setRequestId] = useState<string | null>(null);
  
  // Buffer for content processing
  const [streamBuffer, setStreamBuffer] = useState<string>('');
  
  // Store the active controller for cleanup
  const controllerRef = useRef<AbortController | null>(null);
  
  // Track retries
  const retriesRef = useRef<number>(0);
  
  // Maximum number of automatic retries
  const MAX_RETRIES = 2;
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        try {
          controllerRef.current.abort('Component unmounted');
        } catch (error) {
          console.error('[useAgentStream] Error aborting controller:', error);
        }
        controllerRef.current = null;
      }
    };
  }, []);

  // Start streaming from an agent
  const startStreaming = useCallback(async (request: StreamRequest, command: string) => {
    // Helper function to prepare the request
    const prepareRequest = () => {
      console.log(`[useAgentStream] Starting stream for: ${command.substring(0, 30)}${command.length > 30 ? '...' : ''}`);
      
      // Close any existing streams
      if (controllerRef.current) {
        console.log('[useAgentStream] Aborting existing stream controller');
        try {
          controllerRef.current.abort('New request started');
        } catch (error) {
          console.error('[useAgentStream] Error aborting controller:', error);
        }
        controllerRef.current = null;
      }
      
      // Reset streaming state
      setStreamBuffer('');
      setStreamState({
        isStreaming: true,
        streamingContent: '',
        streamingCommand: command,
        error: null,
        isDone: false,
      });
      setRequestId(null);
      
      // Create new abort controller
      const newController = new AbortController();
      controllerRef.current = newController;
      
      return newController;
    };
    
    // Handle SSE stream setup and processing
    const processStream = async (controller: AbortController) => {
      try {
        // Prepare the endpoint URL and options
        const url = `${baseUrl}/stream`;
        const options: RequestInit = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal: controller.signal,
        };
        
        // Start the stream
        const response = await fetch(url, options);
        
        // Handle HTTP errors
        if (!response.ok) {
          const statusCode = response.status;
          
          // Special handling for 429 (duplicate request)
          if (statusCode === 429) {
            const errorData = await response.json();
            console.log('[useAgentStream] Duplicate request detected by server:', errorData);
            
            // Store the request ID if provided
            if (errorData.requestId) {
              setRequestId(errorData.requestId);
            }
            
            // Set a special message for duplicate requests
            setStreamState(prev => ({
              ...prev,
              streamingContent: 'This request is already being processed. Please wait...',
              error: 'Duplicate request',
            }));
            
            // After a few seconds, check if we need to retry
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // If we haven't exceeded max retries, try again with a slight delay
            if (retriesRef.current < MAX_RETRIES) {
              retriesRef.current++;
              console.log(`[useAgentStream] Retrying request (${retriesRef.current}/${MAX_RETRIES})`);
              
              // Retry with exponential backoff
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retriesRef.current)));
              prepareRequest();
              return processStream(controllerRef.current!);
            } else {
              // Max retries exceeded
              throw new Error('Maximum retries exceeded. Please try again later.');
            }
          }
          
          throw new Error(`HTTP error! status: ${statusCode}`);
        }
        
        if (!response.body) {
          throw new Error("Response body is null");
        }
        
        // Reset retry counter on successful response
        retriesRef.current = 0;
        
        // Process the stream with Reader API
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        // Process chunks as they arrive
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            // Process any remaining buffer content
            if (streamBuffer) {
              setStreamState(prev => ({
                ...prev,
                streamingContent: prev.streamingContent + streamBuffer,
              }));
              setStreamBuffer('');
            }
            
            setStreamState(prev => ({
              ...prev,
              isStreaming: false,
              isDone: true,
            }));
            controllerRef.current = null;
            break;
          }
          
          // Decode the chunk and add it to buffer
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete SSE messages
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || ''; // Keep incomplete chunk in buffer
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6)) as StreamChunk;
                
                // Store request ID if provided
                if (data.requestId && !requestId) {
                  setRequestId(data.requestId);
                }
                
                // Store thread and resource IDs if provided
                if (data.threadId || data.resourceId) {
                  setStreamState(prev => ({
                    ...prev,
                    threadId: data.threadId,
                    resourceId: data.resourceId,
                  }));
                }
                
                if (data.done) {
                  // Process any remaining buffer content
                  if (streamBuffer) {
                    setStreamState(prev => ({
                      ...prev,
                      streamingContent: prev.streamingContent + streamBuffer,
                    }));
                    setStreamBuffer('');
                  }
                  
                  setStreamState(prev => ({
                    ...prev,
                    isStreaming: false,
                    isDone: true,
                  }));
                  controllerRef.current = null;
                  return;
                }
                
                if (data.error) {
                  throw new Error(data.error);
                }
                
                if (data.chunk) {
                  // Append the chunk to our content
                  setStreamState(prev => {
                    // Avoid duplicate chunks - only add if it's not already a suffix of our content
                    const newContent = prev.streamingContent + data.chunk;
                    return {
                      ...prev,
                      streamingContent: newContent
                    };
                  });
                }
                
                // Handle progress updates and steps
                if (data.progress || data.step) {
                  console.log(`[useAgentStream] Progress: ${data.progress || data.step}`);
                }
              } catch (parseError) {
                console.error('[useAgentStream] Error parsing SSE message:', parseError, 'Original line:', line);
              }
            }
          }
        }
      } catch (error) {
        // Only set error state if we're still the active controller
        if (controllerRef.current === controller) {
          console.error('[useAgentStream] Streaming error:', error);
          
          setStreamState(prev => ({
            ...prev,
            isStreaming: false,
            error: error instanceof Error ? error.message : String(error),
          }));
          
          controllerRef.current = null;
        }
      }
    };
    
    // Start the streaming process
    const controller = prepareRequest();
    await processStream(controller);
  }, [baseUrl, requestId, streamBuffer]);

  // Manually append content - useful for client-side handling
  const appendStreamingContent = useCallback((content: string) => {
    setStreamState(prev => ({
      ...prev,
      streamingContent: prev.streamingContent + content,
    }));
  }, []);

  // Manually finish streaming - useful for client-side handling
  const finishStreaming = useCallback(() => {
    setStreamState(prev => ({
      ...prev,
      isStreaming: false,
      isDone: true,
    }));
    
    if (controllerRef.current) {
      controllerRef.current = null;
    }
  }, []);

  // Reset streaming state
  const resetStream = useCallback(() => {
    // Abort any active stream
    if (controllerRef.current) {
      try {
        controllerRef.current.abort('Stream reset');
      } catch (error) {
        console.error('[useAgentStream] Error aborting controller during reset:', error);
      }
      controllerRef.current = null;
    }
    
    // Reset state
    setStreamState({
      isStreaming: false,
      streamingContent: '',
      streamingCommand: '',
      error: null,
      isDone: false,
    });
    setStreamBuffer('');
    setRequestId(null);
    retriesRef.current = 0;
  }, []);
  
  // Abort the current stream
  const abortStream = useCallback(() => {
    if (controllerRef.current) {
      try {
        controllerRef.current.abort('User cancelled');
        console.log('[useAgentStream] Stream aborted by user');
      } catch (error) {
        console.error('[useAgentStream] Error aborting controller:', error);
      }
      controllerRef.current = null;
      
      // Update state to reflect abortion
      setStreamState(prev => ({
        ...prev,
        isStreaming: false,
        error: 'Request cancelled',
      }));
    }
  }, []);

  return {
    ...streamState,
    startStreaming,
    appendStreamingContent,
    finishStreaming,
    resetStream,
    abortStream
  };
}

// Helper to detect URLs
export function isUrl(text: string): boolean {
  try {
    new URL(text);
    return true;
  } catch {
    // Check for common URL patterns without protocol
    const urlPattern = /^(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/i;
    return urlPattern.test(text);
  }
}

// Export the hook as default
export default useAgentStream; 