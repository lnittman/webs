import { useState, useCallback, useEffect } from 'react';

export type AgentMode = 'main' | 'spin' | 'think';

export interface StreamRequest {
  mode: AgentMode;
  url?: string;
  query?: string;
  urls?: string[];
  maxDepth?: number;
  feedbackEnabled?: boolean;
}

export interface StreamState {
  isStreaming: boolean;
  streamingContent: string;
  streamingCommand: string;
  error: string | null;
  isDone: boolean;
}

export interface StreamResult extends StreamState {
  startStreaming: (request: StreamRequest, command: string) => Promise<void>;
  appendStreamingContent: (content: string) => void;
  finishStreaming: () => void;
  resetStream: () => void;
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
  
  // Stream request ID to help deduplicate requests
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  
  // Buffer for streaming content to handle text processing
  const [streamBuffer, setStreamBuffer] = useState<string>('');
  
  // Store the active controller for cleanup
  const [controller, setController] = useState<AbortController | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controller) {
        try {
          controller.abort('Component unmounted');
        } catch (error) {
          console.error('[useAgentStream] Error aborting controller:', error);
        }
      }
    };
  }, [controller]);
  
  // Process streaming content with intelligent boundary detection
  const processStreamChunk = useCallback((newChunk: string): string => {
    // Simply append the new chunk to the existing content
    return streamState.streamingContent + newChunk;
  }, [streamState.streamingContent]);

  // Start streaming from an agent
  const startStreaming = useCallback(async (request: StreamRequest, command: string) => {
    // Console log to help debug double requests
    console.log(`[useAgentStream] Starting stream for: ${command.substring(0, 30)}${command.length > 30 ? '...' : ''}`);
    
    // Generate a request ID based on the command and timestamp to help deduplicate
    const requestId = `${command.slice(0, 10)}-${Date.now()}`;
    
    // Close any existing streams
    if (controller) {
      console.log('[useAgentStream] Aborting existing stream controller');
      try {
        controller.abort('New request started');
      } catch (error) {
        console.error('[useAgentStream] Error aborting controller:', error);
      }
    }
    
    // If we're already streaming the same command, don't start a new stream
    if (streamState.isStreaming && streamState.streamingCommand === command) {
      console.log('[useAgentStream] Already streaming this command, ignoring duplicate request');
      return;
    }
    
    // Reset streaming state
    setStreamBuffer('');
    setStreamState(prev => ({
      isStreaming: true,
      streamingContent: '',
      streamingCommand: command,
      error: null,
      isDone: false,
    }));
    setCurrentRequestId(requestId);
    
    // Create new abort controller
    const newController = new AbortController();
    setController(newController);
    
    // Track unique chunks to prevent duplicates
    const processedChunks = new Set();
    
    try {
      // Prepare the endpoint URL
      let url: string;
      let options: RequestInit;
      
      // Special case for main mode - use dedicated endpoint
      if (request.mode === 'main') {
        url = `${baseUrl}/main`;
        options = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: request.url,
            query: request.query,
            stream: true,
          }),
          signal: newController.signal,
        };
      } else {
        // Use the generic stream endpoint for other modes
        url = `${baseUrl}/stream`;
        options = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal: newController.signal,
        };
      }
      
      // Start the stream
      const response = await fetch(url, options);
      
      // Handle duplicate request errors (HTTP 429)
      if (response.status === 429) {
        console.log('[useAgentStream] Duplicate request detected by server, handling gracefully');
        
        // Set a special message when a duplicate is detected
        setStreamState(prev => ({
          ...prev,
          streamingContent: 'Processing your request... (Another instance of this request is already in progress)',
          isStreaming: true,
        }));
        
        // Wait a bit then try again
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Rather than ending with error, let's retry the request
        setStreamState(prev => ({
          ...prev,
          streamingContent: 'Waiting for the previous request to complete...',
        }));
        
        // Wait to see if the previous request completes
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Finish with a notice
        setStreamState(prev => ({
          ...prev,
          isStreaming: false,
          isDone: true,
          streamingContent: 'Your request is being processed in another tab or window. Please check there for results.',
        }));
        
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (!response.body) {
        throw new Error("Response body is null");
      }
      
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
          setController(null);
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
              const data = JSON.parse(line.substring(6));
              
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
                setController(null);
                return;
              }
              
              if (data.error) {
                throw new Error(data.error);
              }
              
              if (data.chunk) {
                // Check if we've already processed this chunk to avoid duplicates
                // Use a hash or truncated version of the chunk to identify it
                const chunkId = data.chunk.substring(0, Math.min(20, data.chunk.length));
                
                if (!processedChunks.has(chunkId)) {
                  processedChunks.add(chunkId);
                  
                  // Process the chunk by simply appending it
                  setStreamState(prev => ({
                    ...prev,
                    streamingContent: prev.streamingContent + data.chunk,
                  }));
                } else {
                  console.log('[useAgentStream] Skipped duplicate chunk');
                }
              }
            } catch (error) {
              console.error("Error parsing SSE message:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in streaming:", error);
      
      setStreamState(prev => ({
        ...prev,
        isStreaming: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      }));
      setController(null);
    }
  }, [baseUrl, controller, processStreamChunk, streamBuffer]);
  
  // Append content to the streaming content
  const appendStreamingContent = useCallback((content: string) => {
    setStreamState(prev => ({
      ...prev,
      streamingContent: prev.streamingContent + content,
    }));
  }, []);
  
  // Finish streaming
  const finishStreaming = useCallback(() => {
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
    
    if (controller) {
      try {
        controller.abort('Stream finished');
      } catch (error) {
        console.error('[useAgentStream] Error aborting controller on finish:', error);
      }
      setController(null);
    }
  }, [controller, streamBuffer]);
  
  // Reset the stream state
  const resetStream = useCallback(() => {
    setStreamState({
      isStreaming: false,
      streamingContent: '',
      streamingCommand: '',
      error: null,
      isDone: false,
    });
    setStreamBuffer('');
    
    if (controller) {
      try {
        controller.abort('Stream reset');
      } catch (error) {
        console.error('[useAgentStream] Error aborting controller on reset:', error);
      }
      setController(null);
    }
  }, [controller]);
  
  return {
    ...streamState,
    startStreaming,
    appendStreamingContent,
    finishStreaming,
    resetStream,
  };
}

// Helper function to check if text is a URL
export function isUrl(text: string): boolean {
  try {
    new URL(text.trim());
    return true;
  } catch (e) {
    return false;
  }
}

// Export the hook as default
export default useAgentStream; 