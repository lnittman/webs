import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mastra } from '@repo/agents/src/mastra';

// Define input schema for validation
const StreamRequestSchema = z.object({
  mode: z.enum(['main', 'spin', 'think']),
  url: z.string().optional(),
  query: z.string().optional(),
  urls: z.array(z.string()).optional(),
  maxDepth: z.number().min(1).max(5).default(3),
  feedbackEnabled: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const validatedData = StreamRequestSchema.parse(body);
    
    // Select the appropriate agent based on mode
    // Currently only mainAgent is fully implemented
    // @ts-ignore - We're handling the mode selection in the prompt
    const agent = mastra.getAgent('mainAgent');
    
    // Create the prompt based on the mode and input
    let prompt = '';
    if (validatedData.mode === 'main') {
      if (validatedData.url) {
        prompt = `Summarize the content from ${validatedData.url}`;
      } else if (validatedData.query) {
        prompt = `Search for information about ${validatedData.query} and provide a summary`;
      }
    } else if (validatedData.mode === 'spin') {
      if (validatedData.urls && validatedData.urls.length > 0) {
        const urlsList = validatedData.urls.join(', ');
        prompt = `[SPIN MODE] Explore the following URLs and build a network of related content: ${urlsList}. 
        Use a maximum depth of ${validatedData.maxDepth} for exploration.`;
      } else if (validatedData.query) {
        prompt = `[SPIN MODE] Explore information about "${validatedData.query}" and build a network of related content. 
        Use a maximum depth of ${validatedData.maxDepth} for exploration.`;
      }
    } else if (validatedData.mode === 'think') {
      if (validatedData.url) {
        prompt = `[THINK MODE] Analyze ${validatedData.url} deeply with a maximum crawl depth of ${validatedData.maxDepth}. 
        ${validatedData.feedbackEnabled ? 'Pause for feedback when needed.' : 'Complete the analysis without pausing for feedback.'}`;
      }
    }
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Invalid combination of parameters for the selected mode' },
        { status: 400 }
      );
    }
    
    // Create a text encoder for the stream
    const encoder = new TextEncoder();
    
    // Create and return a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream the agent's response
          const agentStream = await agent.stream(prompt);
          
          // Track if controller is closed to prevent double-closure issues
          let isControllerClosed = false;
          
          try {
            // Handle the streaming text chunks
            for await (const chunk of agentStream.textStream) {
              // Check if controller is still open before writing
              if (isControllerClosed) break;
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
              // No delay between chunks
            }
            
            // Signal the end of the stream if not already closed
            if (!isControllerClosed) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
              controller.close();
              isControllerClosed = true;
            }
          } catch (streamError) {
            console.error('Streaming chunk error:', streamError);
            
            // Send error and close if not already closed
            if (!isControllerClosed) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ error: 'An error occurred during streaming' })}\n\n`)
              );
              controller.close();
              isControllerClosed = true;
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: 'An error occurred during streaming' })}\n\n`)
            );
            controller.close();
          } catch (closeError) {
            // If we can't enqueue or close, the controller is already closed
            console.warn('Controller already closed:', closeError);
          }
        }
      }
    });
    
    // Return the stream as an SSE response
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in stream API:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    // Handle other errors
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 