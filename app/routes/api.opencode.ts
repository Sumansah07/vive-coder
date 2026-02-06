/**
 * Daytona AI Agent Proxy
 * 
 * Uses real Claude Agent SDK running in Daytona sandbox
 * with full tool access (Read, Edit, Bash, etc.)
 */

import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { callDaytonaAgent } from '~/lib/.server/daytona/agent';

export async function action({ context, request }: ActionFunctionArgs) {
  try {
    console.log('[Daytona Agent API] Received request');
    
    const body = await request.json<{
      message?: string;
      messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
    }>();
    
    console.log('[Daytona Agent API] Request body:', JSON.stringify(body));

    const { message, messages } = body;

    // Convert single message to messages array if needed
    const chatMessages = messages || [{ role: 'user' as const, content: message || '' }];
    
    console.log('[Daytona Agent API] Calling Daytona agent...');

    // Call Daytona AI agent
    const response = await callDaytonaAgent(chatMessages, context.cloudflare.env);
    
    console.log('[Daytona Agent API] Got response');

    // Return in Vercel AI SDK streaming format
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Escape the message for JSON string format
        const escapedMessage = response.message
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        
        // Send in AI SDK format: 0:"message content"
        controller.enqueue(encoder.encode(`0:"${escapedMessage}"\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1',
      },
    });
  } catch (error) {
    console.error('[Daytona Agent API] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to communicate with Daytona Agent';

    return Response.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 },
    );
  }
}
