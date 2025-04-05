import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mastra } from '@repo/agents/src/mastra';

// Define simplified input schema for validation
const StreamRequestSchema = z.object({
  mode: z.enum(['main', 'spin', 'think']).default('main'),
  prompt: z.string().min(1, "Prompt cannot be empty"),
  maxDepth: z.number().min(1).max(5).default(3),
  feedbackEnabled: z.boolean().default(true),
  threadId: z.string().optional(),
  resourceId: z.string().optional(),
  stream: z.boolean().optional().default(true),
});

// Track active requests to prevent duplicates
const activeRequests = new Map<string, { timestamp: number, controller: AbortController }>();

// Clean up old requests (older than 30 seconds)
function cleanupOldRequests() {
  const now = Date.now();
  for (const [key, value] of activeRequests.entries()) {
    if (now - value.timestamp > 30000) {
      try {
        value.controller.abort('Request timeout');
      } catch (error) {
        console.error(`[STREAM_API] Error aborting old request ${key}:`, error);
      }
      activeRequests.delete(key);
    }
  }
}

// Create a request ID from the request data
function createRequestId(data: { prompt: string, mode: string }): string {
  return `${data.mode}:${data.prompt.substring(0, 50)}`;
}

// Handler for GET requests - convert to POST internally
export async function GET(request: NextRequest) {
  console.log("[STREAM_API] Received GET request, converting to POST");
  
  try {
    // Extract query parameters from URL
    const prompt = request.nextUrl.searchParams.get('prompt');
    const mode = request.nextUrl.searchParams.get('mode') || 'main';
    const maxDepth = Number(request.nextUrl.searchParams.get('maxDepth') || 3);
    const feedbackEnabled = request.nextUrl.searchParams.get('feedbackEnabled') !== 'false';
    const threadId = request.nextUrl.searchParams.get('threadId') || undefined;
    const resourceId = request.nextUrl.searchParams.get('resourceId') || undefined;
    const streamParam = request.nextUrl.searchParams.get('stream');
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing required parameter: prompt' },
        { status: 400 }
      );
    }
    
    // Convert to expected format
    const body = {
      prompt,
      mode: mode as 'main' | 'spin' | 'think',
      maxDepth,
      feedbackEnabled,
      threadId,
      resourceId,
      stream: streamParam ? streamParam === 'true' : true
    };
    
    // Create a new request with POST method
    const postRequest = new NextRequest(request.nextUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // Pass to POST handler
    return POST(postRequest);
  } catch (error) {
    console.error('[STREAM_API] Error handling GET request:', error);
    return NextResponse.json(
      { error: 'Failed to process GET request', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Clean up old requests
    cleanupOldRequests();
    
    // Parse and validate the request body with better error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[STREAM_API] Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Make sure body is an object
    if (!body || typeof body !== 'object') {
      console.error('[STREAM_API] Request body is not an object:', body);
      return NextResponse.json(
        { error: 'Request body must be a JSON object' },
        { status: 400 }
      );
    }
    
    const validatedData = StreamRequestSchema.parse(body);
    
    // Create a request ID to check for duplicates
    const requestId = createRequestId(validatedData);
    
    // Check if a request with this ID is already in progress
    const existingRequest = activeRequests.get(requestId);
    if (existingRequest) {
      console.log(`[STREAM_API] Duplicate request detected: ${requestId}, age: ${Date.now() - existingRequest.timestamp}ms`);
      return NextResponse.json(
        { 
          error: 'A similar request is already in progress',
          requestId  
        },
        { status: 429 }
      );
    }
    
    // Map the mode to appropriate workflow name - simplifying the mapping
    const workflowMap: Record<string, string> = {
      'main': 'mainWorkflow',
      'spin': 'spinWorkflow', 
      'think': 'thinkWorkflow'
    };
    
    const workflowName = workflowMap[validatedData.mode] || 'mainWorkflow';
    
    console.log(`[STREAM_API] Using ${workflowName} workflow for request`);
    
    // Get the workflow
    const workflow = mastra.getWorkflow(workflowName as 'mainWorkflow' | 'spinWorkflow' | 'thinkWorkflow');
    
    if (!workflow) {
      console.error(`[STREAM_API] Workflow ${workflowName} not found, returning error`);
      return NextResponse.json(
        { error: `Workflow ${workflowName} not available` },
        { status: 500 }
      );
    }
    
    // Limit the prompt length to avoid context issues
    let finalPrompt = validatedData.prompt;
    if (finalPrompt.length > 8000) {
      console.log(`[STREAM_API] Truncating long prompt from ${finalPrompt.length} to 8000 characters`);
      finalPrompt = finalPrompt.substring(0, 8000) + "... (content truncated)";
    }
    
    console.log(`[STREAM_API] Processing prompt (mode: ${validatedData.mode}): ${finalPrompt.substring(0, 100)}${finalPrompt.length > 100 ? '...' : ''}`);
    
    // Set a timeout for the request
    const timeoutMs = 180000; // 3 minutes for complex operations
    
    // Only handle the streaming response path - removing non-streaming for simplicity
    // Create a text encoder for the stream
    const encoder = new TextEncoder();
    
    // Create and return a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Create abort controller for this request
          const abortController = new AbortController();
          
          // Register this request as active
          activeRequests.set(requestId, { 
            timestamp: Date.now(),
            controller: abortController
          });
          
          console.log(`[STREAM_API] Registered new request: ${requestId}`);
          
          // Send a message indicating the process has started
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            progress: `Starting ${validatedData.mode} mode analysis...`,
            step: "init",
            timestamp: Date.now(),
            threadId: validatedData.threadId,
            resourceId: validatedData.resourceId,
            requestId: requestId
          })}\n\n`));
          
          // Set up timeout
          const timeoutId = setTimeout(() => {
            console.log(`[STREAM_API] Request timed out: ${requestId}`);
            abortController.abort('Request timeout');
          }, timeoutMs);
          
          // Clean up function for when the request is done
          const cleanupRequest = () => {
            clearTimeout(timeoutId);
            if (activeRequests.has(requestId)) {
              console.log(`[STREAM_API] Removing completed request: ${requestId}`);
              activeRequests.delete(requestId);
            }
          };
          
          // Listen for abort signals
          abortController.signal.addEventListener('abort', () => {
            console.log(`[STREAM_API] Request aborted: ${requestId}`);
            cleanupRequest();
          });
          
          // Configure workflow watcher to report progress via SSE stream
          workflow.watch(async ({ context, activePaths }) => {
            try {
              const activeSteps = Array.from(activePaths).map(path => {
                // Convert path to string
                const pathStr = String(path);
                
                // Access the steps collection safely with type assertions
                const stepsRecord = context.steps as Record<string, { status?: string } | undefined> | undefined;
                const status = stepsRecord && pathStr in stepsRecord ? 
                  stepsRecord[pathStr]?.status || 'unknown' : 
                  'unknown';
                
                return `${pathStr}:${status}`;
              }).join(', ');
              
              // Send step updates to client
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                progress: `Working on: ${activeSteps}`,
                step: Array.from(activePaths)[0] ? String(Array.from(activePaths)[0]) : "processing",
                timestamp: Date.now()
              })}\n\n`));
            } catch (watchError) {
              console.error('[STREAM_API] Error in workflow watcher:', watchError);
            }
          });
          
          // Prepare the trigger data for the workflow
          const triggerData = {
            prompt: finalPrompt,
            threadId: validatedData.threadId,
            resourceId: validatedData.resourceId,
            maxDepth: validatedData.maxDepth || 3,
            feedbackEnabled: validatedData.feedbackEnabled
          };
          
          // Create a run of the workflow
          const { runId, start } = workflow.createRun();
          
          try {
            // Execute the workflow
            const result = await start({ triggerData });
            
            // Find the final response step
            const finalResponseStep = result.results['generateFinalResponse'];
            if (finalResponseStep?.status === 'success' && finalResponseStep.output?.response) {
              // Stream the final response to the client
              const responseText = finalResponseStep.output.response;
              
              // Simulate streaming by sending chunks
              const chunkSize = 15;
              for (let i = 0; i < responseText.length; i += chunkSize) {
                const chunk = responseText.substring(i, i + chunkSize);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  chunk,
                  timestamp: Date.now()
                })}\n\n`));
                
                // Add a small delay to simulate typing
                await new Promise(resolve => setTimeout(resolve, 30));
              }
              
              // Signal the end of the stream
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                done: true,
                message: `${validatedData.mode} mode analysis complete`,
                timestamp: Date.now()
              })}\n\n`));
              
              controller.close();
              cleanupRequest();
            } else {
              // If no final response, return an error
              throw new Error('Workflow completed but no final response was generated');
            }
          } catch (workflowError) {
            const errorMessage = workflowError instanceof Error ? workflowError.message : String(workflowError);
            console.error(`[STREAM_API] Workflow error: ${errorMessage}`);
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              error: `Workflow error: ${errorMessage}`,
              timestamp: Date.now()
            })}\n\n`));
            
            controller.close();
            cleanupRequest();
          }
        } catch (error) {
          console.error('[STREAM_API] Streaming error:', error);
          
          // Clean up the active request entry
          if (activeRequests.has(requestId)) {
            activeRequests.delete(requestId);
          }
          
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                error: error instanceof Error ? error.message : 'An error occurred during streaming',
                timestamp: Date.now()
              })}\n\n`)
            );
            controller.close();
          } catch (closeError) {
            // If we can't enqueue or close, the controller is already closed
            console.warn('[STREAM_API] Controller already closed:', closeError);
          }
        }
      }
    });
    
    // Return the stream as an SSE response
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[STREAM_API] Error:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    // Handle other errors
    return NextResponse.json(
      { error: 'An error occurred while processing your request', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 