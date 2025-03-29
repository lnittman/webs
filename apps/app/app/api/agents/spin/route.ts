import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mastra } from '@repo/agents/src/mastra';

// Define input schema for validation
const SpinRequestSchema = z.object({
  urls: z.array(z.string()).optional(),
  query: z.string().optional(),
  maxDepth: z.number().min(1).max(5).default(3),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const validatedData = SpinRequestSchema.parse(body);
    
    // Get the spin agent from mastra
    const agent = mastra.getAgent('spinAgent');
    
    // Create the prompt for the agent based on the input
    let prompt = '';
    if (validatedData.urls && validatedData.urls.length > 0) {
      const urlsList = validatedData.urls.join(', ');
      prompt = `Explore the following URLs and build a network of related content: ${urlsList}. 
      Use a maximum depth of ${validatedData.maxDepth} for exploration.`;
    } else if (validatedData.query) {
      prompt = `Explore information about "${validatedData.query}" and build a network of related content. 
      Use a maximum depth of ${validatedData.maxDepth} for exploration.`;
    } else {
      return NextResponse.json(
        { error: 'Either urls or query parameter is required' },
        { status: 400 }
      );
    }
    
    // Generate the response from the agent
    const response = await agent.generate(prompt);
    
    // Return the agent's response
    return NextResponse.json({ response: response.text });
  } catch (error) {
    console.error('Error in spin agent API:', error);
    
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