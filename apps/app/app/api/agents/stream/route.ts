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
    
    // Select the agent - currently only mainAgent is fully implemented
    // @ts-ignore - We're handling the mode selection in the prompt
    const agent = mastra.getAgent('mainAgent');
    
    // Add mode prefix to prompt if it's not the default 'main' mode
    let finalPrompt = validatedData.prompt;
    
    // Limit the prompt length to avoid context issues
    if (finalPrompt.length > 8000) {
      console.log(`[STREAM_API] Truncating long prompt from ${finalPrompt.length} to 8000 characters`);
      finalPrompt = finalPrompt.substring(0, 8000) + "... (content truncated)";
    }
    
    if (validatedData.mode !== 'main') {
      finalPrompt = `[${validatedData.mode.toUpperCase()} MODE] ${finalPrompt}. Use a maximum depth of ${validatedData.maxDepth} for exploration.`;
      if (validatedData.mode === 'think' && validatedData.feedbackEnabled) {
        finalPrompt += ' Pause for feedback when needed.';
      }
    }
    
    console.log(`[STREAM_API] Processing prompt (mode: ${validatedData.mode}): ${finalPrompt.substring(0, 100)}${finalPrompt.length > 100 ? '...' : ''}`);
    
    // Set a timeout to prevent hanging requests
    const timeoutMs = 180000; // 3 minutes for complex operations
    
    // Handle streaming response
    if (validatedData.stream) {
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
            
            // Track if controller is closed to prevent double-closure issues
            let isControllerClosed = false;
            
            // Create a set to track processed chunks and prevent duplicates
            const processedChunks = new Set();
            
            // Send a message indicating the process has started
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              progress: `Starting ${validatedData.mode} mode analysis...`,
              step: "init",
              timestamp: Date.now(),
              threadId: validatedData.threadId,
              resourceId: validatedData.resourceId
            })}\n\n`));
            
            // Stream the agent's response
            const streamOptions: any = {};
            
            // Only pass memory options if both required fields are present
            if (validatedData.threadId && validatedData.resourceId) {
              streamOptions.memoryOptions = {
                resourceId: validatedData.resourceId,
                threadId: validatedData.threadId
              };
            }
            
            // Add timeout signal
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
            
            const agentStream = await agent.stream(finalPrompt, streamOptions);
            
            try {
              // Handle the streaming text chunks
              for await (const chunk of agentStream.textStream) {
                // Check if controller is still open before writing
                if (isControllerClosed) break;
                
                // Skip empty chunks
                if (!chunk || chunk.trim() === '') continue;
                
                // Create a unique identifier for this chunk (use first 20 chars)
                const chunkId = chunk.substring(0, Math.min(20, chunk.length));
                
                // Only send chunks we haven't seen before
                if (!processedChunks.has(chunkId)) {
                  processedChunks.add(chunkId);
                  
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                    chunk,
                    timestamp: Date.now()
                  })}\n\n`));
                } else {
                  console.log('[STREAM_API] Skipped duplicate chunk');
                }
              }
              
              // Signal the end of the stream if not already closed
              if (!isControllerClosed) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  done: true,
                  message: `${validatedData.mode} mode analysis complete`,
                  timestamp: Date.now()
                })}\n\n`));
                
                controller.close();
                isControllerClosed = true;
                cleanupRequest();
              }
            } catch (streamError) {
              console.error('[STREAM_API] Streaming chunk error:', streamError);
              
              // Send error and close if not already closed
              if (!isControllerClosed) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ 
                    error: streamError instanceof Error ? streamError.message : 'An error occurred during streaming',
                    timestamp: Date.now()
                  })}\n\n`)
                );
                
                controller.close();
                isControllerClosed = true;
                cleanupRequest();
              }
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
    } else {
      // Non-streaming fallback for backwards compatibility
      console.log(`[STREAM_API] Using non-streaming mode for request: ${requestId}`);
      
      // For non-streaming requests, register the request but use a simpler cleanup
      const abortController = new AbortController();
      activeRequests.set(requestId, { 
        timestamp: Date.now(),
        controller: abortController
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
      });
      
      // Prepare memory options if both thread and resource IDs are provided
      const memoryOptions: any = {};
      if (validatedData.threadId && validatedData.resourceId) {
        memoryOptions.memoryOptions = {
          resourceId: validatedData.resourceId,
          threadId: validatedData.threadId
        };
      }
      
      // Generate the response from the agent with timeout
      const responsePromise = agent.generate(finalPrompt, memoryOptions);
      
      try {
        const response = await Promise.race([responsePromise, timeoutPromise]);
        
        // Clean up the active request
        if (activeRequests.has(requestId)) {
          activeRequests.delete(requestId);
        }
        
        // Check if response text is empty and provide a fallback
        if (!response.text || response.text.trim() === '') {
          console.warn('[STREAM_API] AI generated an empty response - returning fallback message');
          return NextResponse.json({ 
            response: "I apologize, but I couldn't generate a meaningful response for that content. Could you provide a shorter query or a more specific question?",
            warning: "Content was too complex to process"
          });
        }
        
        // Return the agent's response
        return NextResponse.json({ 
          response: response.text,
          threadId: validatedData.threadId,
          resourceId: validatedData.resourceId
        });
      } catch (error) {
        // Clean up the active request
        if (activeRequests.has(requestId)) {
          activeRequests.delete(requestId);
        }
        
        console.error('[STREAM_API] Error or timeout in agent response:', error);
        return NextResponse.json({ 
          response: "I apologize, but I couldn't process that request in time. Please try with a shorter query or a more specific question.",
          warning: "Request timed out"
        }, { status: 500 });
      }
    }
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