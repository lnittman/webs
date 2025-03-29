import { NextRequest, NextResponse } from 'next/server';
import { mastra } from '@/../../packages/agents/src/mastra';

export async function GET(request: NextRequest) {
  try {
    // Get information about registered agents
    const agents = mastra.getAgents();
    const agentList = Object.keys(agents);
    
    // Provide information about available endpoints
    return NextResponse.json({
      version: '1.0.0',
      description: 'Mastra API for web browsing and content processing',
      agents: agentList,
      endpoints: [
        {
          path: '/api/agents/main',
          method: 'POST',
          description: 'Process content with the Main agent for quick summaries',
          params: ['url OR query']
        },
        {
          path: '/api/agents/spin',
          method: 'POST',
          description: 'Process content with the Spin agent for network exploration',
          params: ['urls OR query', 'maxDepth (optional)']
        },
        {
          path: '/api/agents/think',
          method: 'POST',
          description: 'Process content with the Think agent for deep analysis',
          params: ['url', 'maxDepth (optional)', 'feedbackEnabled (optional)']
        },
        {
          path: '/api/agents/stream',
          method: 'POST',
          description: 'Stream responses from any agent in real-time',
          params: ['mode', 'url OR query OR urls', 'maxDepth (optional)', 'feedbackEnabled (optional)']
        },
        {
          path: '/api/agents/feedback',
          method: 'POST',
          description: 'Provide feedback to an ongoing Think agent analysis',
          params: ['threadId', 'feedback']
        }
      ]
    });
  } catch (error) {
    console.error('Error in agents API index:', error);
    
    // Handle other errors
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 