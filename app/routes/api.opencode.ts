/**
 * OpenCode API - Sandbox Agent Integration
 * 
 * Uses the proper Sandbox Agent client
 */

import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { getSandboxAgentClient } from '~/lib/.server/sandbox-agent/sandboxAgentClient';

export async function action({ context, request }: ActionFunctionArgs) {
  try {
    console.log('[Sandbox Agent API] Received request');
    
    const body = await request.json<{
      message?: string;
      messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
    }>();
    
    console.log('[Sandbox Agent API] Request body:', JSON.stringify(body));

    const { message, messages } = body;
    const chatMessages = messages || [{ role: 'user' as const, content: message || '' }];
    
    const client = getSandboxAgentClient();
    // Use timestamp to create unique sessions (avoids stale session issues)
    const sessionId = `bolt-session-${Date.now()}`;
    
    // Ensure session exists with OpenCode agent
    // OpenCode will use E2B sandboxes for code execution
    await client.ensureSession(sessionId, 'opencode', 'build');
    
    // Get last message
    const lastMessage = chatMessages[chatMessages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      throw new Error('No user message found');
    }
    
    console.log('[Sandbox Agent] Sending message:', lastMessage.content.substring(0, 100));
    
    // Post message
    await client.postMessage(sessionId, { message: lastMessage.content });
    
    // Stream events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of client.streamEvents(sessionId)) {
            console.log('[Sandbox Agent] Event:', event.type, event.data ? JSON.stringify(event.data).substring(0, 200) : '');
            
            // Handle different event types
            switch (event.type) {
              case 'item.delta':
                // Delta events contain incremental text updates
                if (event.data?.delta) {
                  const escaped = event.data.delta
                    .replace(/\\/g, '\\\\')
                    .replace(/"/g, '\\"')
                    .replace(/\n/g, '\\n')
                    .replace(/\r/g, '\\r')
                    .replace(/\t/g, '\\t');
                  
                  controller.enqueue(encoder.encode(`0:"${escaped}"\n`));
                }
                break;
                
              case 'text':
              case 'message':
              case 'artifact.output':
                // Text content from agent
                if (event.data?.content) {
                  const escaped = event.data.content
                    .replace(/\\/g, '\\\\')
                    .replace(/"/g, '\\"')
                    .replace(/\n/g, '\\n')
                    .replace(/\r/g, '\\r')
                    .replace(/\t/g, '\\t');
                  
                  controller.enqueue(encoder.encode(`0:"${escaped}"\n`));
                }
                break;
                
              case 'tool.call':
                // Tool execution (file operations, etc.)
                console.log('[Sandbox Agent] Tool call:', event.data?.tool);
                break;
                
              case 'item.completed':
                // Check if this is the turn completion status
                if (event.data?.item?.kind === 'status' && 
                    event.data?.item?.content?.[0]?.label === 'turn.completed') {
                  console.log('[Sandbox Agent] Turn completed');
                  controller.close();
                  return;
                }
                break;
                
              case 'turn.completed':
              case 'done':
                // Agent finished
                console.log('[Sandbox Agent] Turn completed');
                controller.close();
                return;
                
              case 'error':
                // Error occurred
                console.error('[Sandbox Agent] Error:', event.data);
                controller.close();
                return;
            }
          }
          
          // Stream ended without explicit completion
          console.log('[Sandbox Agent] Stream ended');
          controller.close();
        } catch (error) {
          console.error('[Sandbox Agent] Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1',
      },
    });
  } catch (error) {
    console.error('[Sandbox Agent API] Error:', error);

    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Failed to communicate with Sandbox Agent',
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 },
    );
  }
}
