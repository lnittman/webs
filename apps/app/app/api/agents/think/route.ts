import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mastra } from '@repo/agents/src/mastra';

// Define input schema for validation
const ThinkRequestSchema = z.object({
  url: z.string(),
  maxDepth: z.number().min(1).max(5).default(3),
  feedbackEnabled: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const validatedData = ThinkRequestSchema.parse(body);
    
    // Get the think agent from mastra
    const agent = mastra.getAgent('thinkAgent');
    
    // Create the prompt for the agent based on the input
    const prompt = `Analyze ${validatedData.url} deeply with a maximum crawl depth of ${validatedData.maxDepth}. 
    ${validatedData.feedbackEnabled ? 'Pause for feedback when needed.' : 'Complete the analysis without pausing for feedback.'}`;
    
    // Generate the response from the agent using streaming for better UX during deep analysis
    const response = await agent.generate(prompt, {
      // Additional options can be passed here if needed
      // For example, custom memory options or tool settings
    });
    
    // Return the agent's response
    return NextResponse.json({ response: response.text });
  } catch (error) {
    console.error('Error in think agent API:', error);
    
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