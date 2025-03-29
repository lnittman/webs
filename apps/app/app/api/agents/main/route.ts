import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mastra } from '@repo/agents/src/mastra';

// Define input schema for validation
const MainRequestSchema = z.object({
  url: z.string().optional(),
  query: z.string().optional(),
  stream: z.boolean().optional().default(true), // Added streaming option, enabled by default
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
        console.error(`[MASTRA_API] Error aborting old request ${key}:`, error);
      }
      activeRequests.delete(key);
    }
  }
}

// Create a request ID from the request data
function createRequestId(data: { url?: string, query?: string }): string {
  if (data.url) {
    return `url:${data.url}`;
  } else if (data.query) {
    return `query:${data.query.substring(0, 50)}`;
  }
  return 'unknown';
}

// Define the response type from the agent
interface AgentResponse {
  text: string;
  [key: string]: any;
}

// Handler for GET requests - convert to POST internally
export async function GET(request: NextRequest) {
  console.log("[MASTRA_API] Received GET request, converting to POST");
  
  try {
    // Extract query parameters from URL
    const url = request.nextUrl.searchParams.get('url');
    const query = request.nextUrl.searchParams.get('query');
    const streamParam = request.nextUrl.searchParams.get('stream');
    
    // Convert to expected format
    const body = {
      url: url || undefined,
      query: query || undefined,
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
    console.error('[MASTRA_API] Error handling GET request:', error);
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
      console.error('[MASTRA_API] Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Make sure body is an object
    if (!body || typeof body !== 'object') {
      console.error('[MASTRA_API] Request body is not an object:', body);
      return NextResponse.json(
        { error: 'Request body must be a JSON object' },
        { status: 400 }
      );
    }
    
    const validatedData = MainRequestSchema.parse(body);
    
    // Create a request ID to check for duplicates
    const requestId = createRequestId(validatedData);
    
    // Check if a request with this ID is already in progress
    const existingRequest = activeRequests.get(requestId);
    if (existingRequest) {
      console.log(`[MASTRA_API] Duplicate request detected: ${requestId}, age: ${Date.now() - existingRequest.timestamp}ms`);
      return NextResponse.json(
        { error: 'A request for this URL or query is already in progress' },
        { status: 429 }
      );
    }
    
    // Get the main agent from mastra
    const agent = mastra.getAgent('mainAgent');
    
    // Create the prompt for the agent based on the input
    let prompt = '';
    
    if (validatedData.url) {
      prompt = `Thoroughly analyze and summarize the content from ${validatedData.url}. 
      Explore relevant links on the page to provide a comprehensive understanding of the topic.`;
    } else if (validatedData.query) {
      // Limit the prompt length to avoid context issues
      const query = validatedData.query.length > 8000 
        ? validatedData.query.substring(0, 8000) + "... (content truncated)"
        : validatedData.query;
        
      prompt = `Search for information about ${query} and provide a comprehensive summary. 
      Try to be concise while covering the key points.`;
    } else {
      return NextResponse.json(
        { error: 'Either url or query parameter is required' },
        { status: 400 }
      );
    }
    
    // Log the prompt length for debugging
    console.log(`[MASTRA_API] Processing prompt with length: ${prompt.length} characters`);
    
    // Set a timeout to prevent hanging requests
    const timeoutMs = 180000; // Extended to 3 minutes (180 seconds) for complex crawling operations
    
    // Handle streaming response if requested (default)
    if (validatedData.stream) {
      const encoder = new TextEncoder();
      
      // Create a readable stream to send progress updates
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
            
            console.log(`[MASTRA_API] Registered new request: ${requestId}`);
            
            // Get a streaming response from the agent
            const agentStream = await agent.stream(prompt);
            
            // Track if controller is closed to prevent double-closure issues
            let isControllerClosed = false;
            
            // Create a set to track processed chunks and prevent duplicates
            const processedChunks = new Set();
            
            // Send a message indicating the process has started
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              progress: "Starting research...",
              step: "init"
            })}\n\n`));
            
            // Clean up function for when the request is done
            const cleanupRequest = () => {
              if (activeRequests.has(requestId)) {
                console.log(`[MASTRA_API] Removing completed request: ${requestId}`);
                activeRequests.delete(requestId);
              }
            };
            
            // Listen for abort signals
            abortController.signal.addEventListener('abort', () => {
              console.log(`[MASTRA_API] Request aborted: ${requestId}`);
              cleanupRequest();
            });
            
            // Stream thinking steps and partial outputs
            try {
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
                  
                  // Send chunks as they arrive
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                    chunk,
                    timestamp: Date.now()
                  })}\n\n`));
                } else {
                  console.log('[MASTRA_API] Skipped duplicate chunk');
                }
              }
              
              // Send the final message and close the stream
              if (!isControllerClosed) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  done: true,
                  message: "Research complete",
                  timestamp: Date.now()
                })}\n\n`));
                
                controller.close();
                isControllerClosed = true;
                cleanupRequest();
              }
            } catch (streamError) {
              console.error('[MASTRA_API] Error in streaming chunks:', streamError);
              
              // Send error message and close the stream if not already closed
              if (!isControllerClosed) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  error: streamError instanceof Error ? streamError.message : 'An error occurred during streaming',
                  timestamp: Date.now()
                })}\n\n`));
                
                controller.close();
                isControllerClosed = true;
                cleanupRequest();
              }
            }
          } catch (error) {
            console.error('[MASTRA_API] Error in streaming response:', error);
            
            // Clean up the active request entry
            if (activeRequests.has(requestId)) {
              activeRequests.delete(requestId);
            }
            
            // Send error message and close the stream
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                error: error instanceof Error ? error.message : 'An error occurred during processing',
                timestamp: Date.now()
              })}\n\n`));
              
              controller.close();
            } catch (closeError) {
              // If we can't enqueue or close, the controller is already closed
              console.warn('[MASTRA_API] Controller already closed:', closeError);
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
    }
    
    // For non-streaming requests, register the request but use a simpler cleanup
    const abortController = new AbortController();
    activeRequests.set(requestId, { 
      timestamp: Date.now(),
      controller: abortController
    });
    
    // Non-streaming fallback for backwards compatibility
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
    });
    
    // Generate the response from the agent with timeout
    const responsePromise = agent.generate(prompt);
    let response: AgentResponse;
    
    try {
      response = await Promise.race([responsePromise, timeoutPromise]) as AgentResponse;
      
      // Clean up the active request
      if (activeRequests.has(requestId)) {
        activeRequests.delete(requestId);
      }
    } catch (error) {
      // Clean up the active request
      if (activeRequests.has(requestId)) {
        activeRequests.delete(requestId);
      }
      
      console.error('Error or timeout in agent response:', error);
      return NextResponse.json({ 
        response: "I apologize, but I couldn't process that request in time. Please try with a shorter query or a more specific question.",
        warning: "Request timed out"
      });
    }
    
    // Check if response text is empty and provide a fallback
    if (!response.text || response.text.trim() === '') {
      console.warn('AI generated an empty response - returning fallback message');
      return NextResponse.json({ 
        response: "I apologize, but I couldn't generate a meaningful response for that content. Could you provide a shorter query or a more specific question?",
        warning: "Content was too complex to process"
      });
    }
    
    // Return the agent's response
    return NextResponse.json({ response: response.text });
  } catch (error) {
    console.error('Error in main agent API:', error);
    
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