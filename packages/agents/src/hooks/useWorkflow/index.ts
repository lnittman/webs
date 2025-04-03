import { useState, useCallback, useEffect, useRef } from 'react';
import { useAgentStream, StreamRequest } from '../useAgentStream';

// Types for the workflow hook
export type WorkflowType = 'main' | 'spin' | 'think';

export interface WorkflowOptions {
  threadId?: string;
  resourceId?: string;
  mode?: WorkflowType;
}

export interface WorkflowExecutionState {
  isExecuting: boolean;
  isDone: boolean;
  isError: boolean;
  result: string;
  error: string | null;
  threadId?: string;
  resourceId?: string;
}

export interface WorkflowHookResult extends WorkflowExecutionState {
  executeWorkflow: (input: string, options?: WorkflowOptions) => Promise<void>;
  abortWorkflow: () => void;
  resetWorkflow: () => void;
}

/**
 * A hook for managing workflow execution with streaming results
 */
export function useWorkflow(baseUrl: string = '/api/agents'): WorkflowHookResult {
  // Use our streaming hook for real-time updates
  const agentStream = useAgentStream(baseUrl);
  
  // Track workflow execution state
  const [workflowState, setWorkflowState] = useState<WorkflowExecutionState>({
    isExecuting: false,
    isDone: false,
    isError: false,
    result: '',
    error: null,
    threadId: undefined,
    resourceId: undefined,
  });
  
  // Track input and options for potential retries
  const lastInputRef = useRef<string | null>(null);
  const lastOptionsRef = useRef<WorkflowOptions | null>(null);
  
  // Update our state when stream state changes
  useEffect(() => {
    // If there's streaming content, update our result
    if (agentStream.streamingContent) {
      setWorkflowState(prev => ({
        ...prev,
        result: agentStream.streamingContent,
        threadId: agentStream.threadId,
        resourceId: agentStream.resourceId,
      }));
    }
    
    // If streaming is done, update our completion state
    if (agentStream.isDone) {
      setWorkflowState(prev => ({
        ...prev,
        isExecuting: false,
        isDone: true,
      }));
    }
    
    // If there's an error, update our error state
    if (agentStream.error) {
      setWorkflowState(prev => ({
        ...prev,
        isExecuting: false,
        isError: true,
        error: agentStream.error,
      }));
    }
  }, [
    agentStream.streamingContent,
    agentStream.isDone,
    agentStream.error,
    agentStream.threadId,
    agentStream.resourceId
  ]);
  
  /**
   * Execute a workflow with the given input and options
   */
  const executeWorkflow = useCallback(async (input: string, options?: WorkflowOptions) => {
    // Save the input and options for potential retries
    lastInputRef.current = input;
    lastOptionsRef.current = options || null;
    
    // Reset any previous state
    setWorkflowState({
      isExecuting: true,
      isDone: false,
      isError: false,
      result: '',
      error: null,
      threadId: options?.threadId,
      resourceId: options?.resourceId,
    });
    
    try {
      // Prepare the stream request based on the input and options
      const request: StreamRequest = {
        mode: options?.mode || 'main',
        prompt: input,
        // Include memory context if provided
        threadId: options?.threadId,
        resourceId: options?.resourceId,
      };
      
      // Start streaming with our request
      await agentStream.startStreaming(request, input);
      
      // When streaming is complete, the useEffect will update our state
    } catch (error) {
      console.error('[useWorkflow] Error executing workflow:', error);
      
      // Update our error state
      setWorkflowState(prev => ({
        ...prev,
        isExecuting: false,
        isError: true,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }, [agentStream]);
  
  /**
   * Abort the currently executing workflow
   */
  const abortWorkflow = useCallback(() => {
    // Abort the streaming
    agentStream.abortStream();
    
    // Update our state
    setWorkflowState(prev => ({
      ...prev,
      isExecuting: false,
      error: 'Workflow aborted by user',
    }));
  }, [agentStream]);
  
  /**
   * Reset the workflow state
   */
  const resetWorkflow = useCallback(() => {
    // Reset the stream
    agentStream.resetStream();
    
    // Reset our state
    setWorkflowState({
      isExecuting: false,
      isDone: false,
      isError: false,
      result: '',
      error: null,
      threadId: undefined,
      resourceId: undefined,
    });
    
    // Clear saved input and options
    lastInputRef.current = null;
    lastOptionsRef.current = null;
  }, [agentStream]);
  
  // Return the workflow state and actions
  return {
    ...workflowState,
    executeWorkflow,
    abortWorkflow,
    resetWorkflow,
  };
}

export default useWorkflow; 