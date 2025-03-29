import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mastra } from '@repo/agents/src/mastra';

// Define input schema for validation
const FeedbackRequestSchema = z.object({
  threadId: z.string(),
  feedback: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const validatedData = FeedbackRequestSchema.parse(body);
    
    // Get the think agent from mastra
    const agent = mastra.getAgent('thinkAgent');
    
    // Find the tool that's waiting for feedback
    const humanFeedbackTool = agent.tools['human_feedback_tool'];
    
    if (!humanFeedbackTool) {
      return NextResponse.json(
        { error: 'Human feedback tool not found' },
        { status: 400 }
      );
    }
    
    // Resume the workflow with the feedback
    const result = await humanFeedbackTool.resume(validatedData.threadId, {
      feedback: validatedData.feedback
    });
    
    // Return success response
    return NextResponse.json({ success: true, message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Error in feedback API:', error);
    
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