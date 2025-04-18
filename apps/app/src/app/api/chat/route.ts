import { CoreMessage } from "@mastra/core";

import { mastra } from "@/src/lib/mastra";

export async function POST(req: Request) {
  const { message, threadId, resourceId }: { message: CoreMessage | null; threadId: string; resourceId: string } = await req.json();

  // Handle cases where message might be null (e.g., initial load or error)
  if (!message || !message.content) {
    return new Response("Missing message content", { status: 400 });
  }

  // Get the chat agent from mastra
  const chatAgent = mastra.getAgent("chat");
  
  // Process with memory using the single message content
  const stream = await chatAgent.stream(message.content, {
    threadId,
    resourceId,
  });

  // Return the streaming response
  return stream.processDataStream();
}