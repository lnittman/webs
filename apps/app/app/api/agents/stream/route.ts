import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Define simplified input schema for validation
const StreamRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty"),
  threadId: z.string().optional(),
  resourceId: z.string().optional(),
  stream: z.boolean().optional().default(true),
});

// Base URL for the standalone mastra server
const MASTRA_API_URL = process.env.NEXT_PUBLIC_MASTRA_API_URL || 'http://localhost:4111';

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
function createRequestId(data: { prompt: string }): string {
  return `${data.prompt.substring(0, 50)}`;
}

// Handler for GET requests - convert to POST internally
export async function GET(request: NextRequest) {
  console.log("[STREAM_API] Received GET request, converting to POST");
  
  try {
    // Extract query parameters from URL
    const prompt = request.nextUrl.searchParams.get('prompt');
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

    // Forward the request to the Mastra server using the new endpoints
    console.log(`[STREAM_API] Forwarding request to standalone Mastra server`);
    
    // Create abort controller for this request
    const abortController = new AbortController();
    
    // Register this request as active
    activeRequests.set(requestId, { 
      timestamp: Date.now(),
      controller: abortController
    });
    
    try {
      // Send the request to the standalone Mastra server
      // Updated URL to use the correct API endpoint for the standalone server
      const url = `${MASTRA_API_URL}/api/agents/chat/stream`;
      
      // Format the request body for the Mastra API
      const mastraRequestBody = {
        messages: [{ role: "user", content: validatedData.prompt }],
        threadId: validatedData.threadId,
        resourceId: validatedData.resourceId,
        stream: true
      };

      console.log(`[STREAM_API] Sending request to ${url} with body:`, JSON.stringify(mastraRequestBody, null, 2));
      
      const mastraResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mastraRequestBody),
        signal: abortController.signal,
      });
      
      if (!mastraResponse.ok) {
        const errorText = await mastraResponse.text();
        console.error('[STREAM_API] Error from Mastra server:', mastraResponse.status, errorText);
        return NextResponse.json(
          { error: `Mastra server error: ${mastraResponse.status} ${mastraResponse.statusText}` },
          { status: mastraResponse.status }
        );
      }
      
      // Simply proxy the stream response
      return new Response(mastraResponse.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } catch (error) {
      console.error('[STREAM_API] Error forwarding request to Mastra server:', error);
      return NextResponse.json(
        { error: 'Failed to connect to Mastra server', message: error instanceof Error ? error.message : String(error) },
        { status: 502 }
      );
    } finally {
      // Clean up the request tracking
      if (activeRequests.has(requestId)) {
        activeRequests.delete(requestId);
      }
    }
  } catch (error) {
    console.error('[STREAM_API] Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 