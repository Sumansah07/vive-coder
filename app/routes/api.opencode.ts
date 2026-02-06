/**
 * OpenCode Web Agent Proxy
 * 
 * Direct integration with OpenCode running in Daytona
 */

import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { callOpenCodeAgent } from '~/lib/.server/daytona/opencode';

export async function action({ context, request }: ActionFunctionArgs) {
  try {
    console.log('[OpenCode API] Received request');
    
    const body = await request.json<{
      message?: string;
      messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
    }>();
    
    console.log('[OpenCode API] Request body:', JSON.stringify(body));

    const { message, messages } = body;

    // Convert single message to messages array if needed
    const chatMessages = messages || [{ role: 'user' as const, content: message || '' }];
    
    console.log('[OpenCode API] Calling OpenCode agent with messages:', JSON.stringify(chatMessages));

    // Call OpenCode agent
    const response = await callOpenCodeAgent(chatMessages, context.cloudflare.env);
    
    console.log('[OpenCode API] Got response:', JSON.stringify(response));

    // Return in AI SDK format for useChat compatibility
    return new Response(
      JSON.stringify({
        id: Date.now().toString(),
        role: 'assistant',
        content: response.message,
        // Include additional OpenCode data
        files: response.files,
        commands: response.commands,
        sandboxUrl: response.sandboxUrl,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('[OpenCode API] Error details:', error);
    console.error('[OpenCode API] Error stack:', error instanceof Error ? error.stack : 'No stack');

    const errorMessage = error instanceof Error ? error.message : 'Failed to communicate with OpenCode Agent';
    console.error('[OpenCode API] Returning error:', errorMessage);

    return Response.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 },
    );
  }
}
