import { useState, useCallback, useEffect, useRef } from 'react';

export interface AgentOptions {
  threadId?: string;
  resourceId?: string;
}

export interface AgentState {
  isStreaming: boolean;
  isDone: boolean;
  isError: boolean;
  content: string;
  error: string | null;
  threadId?: string;
  resourceId?: string;
  requestId?: string;
  // For tool calls
  toolCallId?: string;
  toolName?: string;
  toolArgs?: any;
  toolResult?: any;
  isToolCall?: boolean;
}

export interface AgentHookResult extends AgentState {
  sendMessage: (input: string, options?: AgentOptions) => Promise<void>;
  cancelStream: () => void;
  resetState: () => void;
}

/**
 * A hook for streaming chat messages from the mastra agents API
 */
export function useAgent(): AgentHookResult {
  // Store the active AbortController for the fetch request
  const controllerRef = useRef<AbortController | null>(null);
  
  // Track agent state
  const [agentState, setAgentState] = useState<AgentState>({
    isStreaming: false,
    isDone: false,
    isError: false,
    content: '',
    error: null,
    threadId: undefined,
    resourceId: undefined,
    requestId: undefined,
    toolCallId: undefined,
    toolName: undefined,
    toolArgs: undefined,
    toolResult: undefined,
    isToolCall: false
  });
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        try {
          controllerRef.current.abort('Component unmounted');
        } catch (error) {
          console.error('[useAgent] Error aborting controller on unmount:', error);
        }
        controllerRef.current = null;
      }
    };
  }, []);
  
  /**
   * Send a message to the agent
   */
  const sendMessage = useCallback(async (input: string, options?: AgentOptions) => {
    console.log(`[useAgent] Sending message: ${input.substring(0, 50)}...`);
    
    // Abort any existing request
    if (controllerRef.current) {
      console.log('[useAgent] Aborting previous stream.');
      controllerRef.current.abort('New message started');
    }
    
    // Create a new AbortController for this request
    const newController = new AbortController();
    controllerRef.current = newController;
    
    // Reset state for the new stream
    setAgentState({
      isStreaming: true,
      isDone: false,
      isError: false,
      content: '',
      error: null,
      threadId: options?.threadId,
      resourceId: options?.resourceId,
      requestId: undefined,
      toolCallId: undefined,
      toolName: undefined,
      toolArgs: undefined,
      toolResult: undefined,
      isToolCall: false
    });
    
    // Process a single stream line based on its prefix
    function processStreamLine(line: string) {
      console.log(`[useAgent] Processing line: "${line.substring(0, Math.min(50, line.length))}..."`, {
        lineLength: line.length,
        startsWithF: line.startsWith('f:'),
        startsWithZero: line.startsWith('0:'),
        startsWithE: line.startsWith('e:'),
        startsWithD: line.startsWith('d:')
      });
      
      // Handle standard SSE format
      if (line.startsWith('data: ')) {
        try {
          const parsedData = JSON.parse(line.substring(6));
          console.log('[useAgent] SSE data format received:', parsedData);
          handleStreamData(parsedData);
        } catch (parseError) {
          console.error('[useAgent] Error parsing SSE message:', parseError, 'Original line:', line);
        }
      }
      // Handle custom format for lines starting with special prefixes  
      else if (line.startsWith('0:')) {
        // Content chunk (e.g., "0:content")
        const contentMatch = line.match(/^0:(.*)/);
        if (contentMatch && contentMatch[1]) {
          // Some content chunks might be JSON strings, others might be direct text
          // Extract the actual content regardless of format
          let content = contentMatch[1];
          
          // If it starts with a quote and ends with a quote, remove them
          if (content.startsWith('"') && content.endsWith('"')) {
            content = content.substring(1, content.length - 1);
          }
          
          // Also handle escaped characters if it's a JSON string
          try {
            if (content.includes('\\')) {
              content = JSON.parse(`"${content}"`);
            }
          } catch (e) {
            // If JSON parsing fails, use the content as is
            console.log('[useAgent] Could not parse content as JSON string, using as-is');
          }
          
          console.log(`[useAgent] Got content chunk of length ${content.length}`);
          console.log(`[useAgent] Content preview: "${content.substring(0, Math.min(30, content.length))}..."`);
          handleStreamData({ chunk: content });
        }
      }
      else if (line.startsWith('9:')) {
        // Tool call (e.g., "9:{json}")
        try {
          const toolCallMatch = line.match(/^9:(.*)/);
          if (toolCallMatch && toolCallMatch[1]) {
            const toolCallData = JSON.parse(toolCallMatch[1]);
            console.log(`[useAgent] Got tool call: ${toolCallData.toolName}`);
            handleStreamData({ 
              isToolCall: true, 
              toolCallId: toolCallData.toolCallId,
              toolName: toolCallData.toolName, 
              toolArgs: toolCallData.args 
            });
          }
        } catch (error) {
          console.error('[useAgent] Error parsing tool call:', error);
        }
      }
      else if (line.startsWith('a:')) {
        // Tool result (e.g., "a:{json}")
        try {
          const toolResultMatch = line.match(/^a:(.*)/);
          if (toolResultMatch && toolResultMatch[1]) {
            const toolResultData = JSON.parse(toolResultMatch[1]);
            console.log(`[useAgent] Got tool result for ID: ${toolResultData.toolCallId}`);
            handleStreamData({ 
              isToolCall: true, 
              toolCallId: toolResultData.toolCallId,
              toolResult: toolResultData.result 
            });
          }
        } catch (error) {
          console.error('[useAgent] Error parsing tool result:', error);
        }
      }
      else if (line.startsWith('f:')) {
        // Handle f: format that includes message ID
        console.log('[useAgent] Got f: marker (messageId)');
        try {
          const messageIdMatch = line.match(/^f:(.*)/);
          if (messageIdMatch && messageIdMatch[1]) {
            const messageData = JSON.parse(messageIdMatch[1]);
            console.log('[useAgent] Message ID data:', messageData);
          }
        } catch (error) {
          console.log('[useAgent] Could not parse f: data');
        }
      }
      else if (line.startsWith('e:')) {
        // End marker - this is critical for marking stream completion
        console.log('[useAgent] Stream end marker received (e:)');
        try {
          const endMatch = line.match(/^e:(.*)/);
          if (endMatch && endMatch[1]) {
            const endData = JSON.parse(endMatch[1]);
            console.log('[useAgent] End data:', endData);
          }
        } catch (error) {
          console.log('[useAgent] End marker with no parseable JSON data');
        }
        handleStreamData({ done: true });
      }
      else if (line.startsWith('d:')) {
        // Deprecated end marker - still handling for compatibility
        console.log('[useAgent] Stream end marker received (d:)');
        handleStreamData({ done: true });
      }
      else if (line.startsWith('3:')) {
        // Error message
        try {
          const errorMatch = line.match(/^3:(.*)/);
          if (errorMatch && errorMatch[1]) {
            const errorMessage = errorMatch[1];
            console.error(`[useAgent] Error message from stream: ${errorMessage}`);
            handleStreamData({ error: errorMessage });
          }
        } catch (error) {
          console.error('[useAgent] Error parsing error message:', error);
        }
      }
      else {
        // Log any unhandled line formats
        console.log('[useAgent] Unhandled stream line format:', line);
      }
    }
    
    try {
      // Prepare options for the API call
      const apiOptions = {
        prompt: input,
        threadId: options?.threadId,
        resourceId: options?.resourceId,
        stream: true,
      };
      
      // Call the agents stream endpoint
      const response = await fetch('/api/agents/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiOptions),
        signal: newController.signal,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      if (!response.body) {
        throw new Error('Response body is null');
      }
      
      // Process the stream
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      
      let buffer = '';
      let bufferLines = [];
      
      while (true) {
        // Check if the request was aborted
        if (newController.signal.aborted) {
          console.log('[useAgent] Stream aborted.');
          setAgentState(prev => ({ ...prev, isStreaming: false, error: 'Stream aborted' }));
          break;
        }
        
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('[useAgent] Stream finished.');
          
          // Process any remaining buffer before ending
          if (buffer.trim()) {
            console.log(`[useAgent] Processing remaining buffer: ${buffer.substring(0, 50)}...`);
            // Try to process any remaining lines in buffer
            const remainingLines = buffer.split('\n');
            for (const line of remainingLines) {
              if (line.trim()) {
                processStreamLine(line.trim());
              }
            }
          }
          
          setAgentState(prev => ({ ...prev, isStreaming: false, isDone: true }));
          controllerRef.current = null; // Clear controller ref on completion
          break;
        }
        
        // Debug raw incoming data
        console.log(`[useAgent] Received chunk: "${value.substring(0, Math.min(50, value.length))}..."`, {
          chunkLength: value.length
        });
        
        // Append new data to buffer
        buffer += value;
        
        // Process complete lines (separated by newlines)
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last potentially incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim()) {
            processStreamLine(line.trim());
          }
        }
      }
    } catch (error: any) {
       // Only update state if this controller is still the active one
      if (controllerRef.current === newController) {
          console.error('[useAgent] Error in stream:', error);
          setAgentState(prev => ({
            ...prev,
            isStreaming: false,
            isError: true,
            error: error.signal?.aborted ? 'Stream aborted' : (error.message || String(error)),
          }));
          controllerRef.current = null; // Clear controller on error
      } else {
          console.warn('[useAgent] Error received for an outdated stream, ignoring.', error);
      }
    }
  }, []);
  
  // Handle stream data updates
  const handleStreamData = useCallback((data: any) => {
    console.log('[useAgent] handleStreamData called with:', 
      data.chunk ? `content chunk (${data.chunk.length} chars)` : 
      data.done ? 'done marker' : 
      data.isToolCall ? 'tool call/result' : 
      'other data'
    );

    setAgentState(prev => {
      const newState = { ...prev };
      
      // Handle content chunks
      if (data.chunk) {
        const newContent = prev.content + data.chunk;
        console.log(`[useAgent] Adding content chunk, length=${data.chunk.length}, total now: ${newContent.length}`);
        console.log(`[useAgent] Content preview: ${newContent.substring(newContent.length - Math.min(50, newContent.length))}`);
        newState.content = newContent;
      }
      
      // Handle metadata
      if (data.threadId) newState.threadId = data.threadId;
      if (data.resourceId) newState.resourceId = data.resourceId;
      if (data.requestId) newState.requestId = data.requestId;
      
      // Handle tool calls
      if (data.isToolCall) {
        newState.isToolCall = true;
        if (data.toolCallId) newState.toolCallId = data.toolCallId;
        if (data.toolName) newState.toolName = data.toolName;
        if (data.toolArgs) newState.toolArgs = data.toolArgs;
        if (data.toolResult) newState.toolResult = data.toolResult;
      }
      
      // Handle errors
      if (data.error) {
        newState.isError = true;
        newState.error = data.error;
        newState.isStreaming = false;
      }
      
      // Handle completion
      if (data.done) {
        console.log(`[useAgent] Setting isDone=true, final content length: ${newState.content.length}`);
        if (newState.content.length === 0) {
          console.log('[useAgent] WARNING: Stream completed with empty content!');
        }
        newState.isDone = true;
        newState.isStreaming = false;
      }
      
      return newState;
    });
  }, []);
  
  /**
   * Cancel the current stream
   */
  const cancelStream = useCallback(() => {
    if (controllerRef.current) {
      console.log('[useAgent] Cancelling stream via user request.');
      try {
        controllerRef.current.abort('User cancelled');
      } catch (error) {
         console.error('[useAgent] Error aborting controller:', error);
      }
      controllerRef.current = null; // Clear the ref immediately
    }
  }, []);
  
  /**
   * Reset the agent state
   */
  const resetState = useCallback(() => {
    cancelStream(); // Cancel any active stream first
    
    // Reset state
    setAgentState({
      isStreaming: false,
      isDone: false,
      isError: false,
      content: '',
      error: null,
      threadId: undefined,
      resourceId: undefined,
      requestId: undefined,
      toolCallId: undefined,
      toolName: undefined,
      toolArgs: undefined,
      toolResult: undefined,
      isToolCall: false
    });
  }, [cancelStream]);
  
  // Return the agent state and actions
  return {
    ...agentState,
    sendMessage,
    cancelStream,
    resetState,
  };
}

export default useAgent; 