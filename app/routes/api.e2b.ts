/**
 * E2B + Claude Code API
 * 
 * Proper streaming architecture:
 * - Tokens stream immediately (real-time UX)
 * - Tools execute in parallel (E2B sandbox)
 * - Events flow to UI continuously
 */

import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { ClaudeCodeAgent } from '~/lib/.server/e2b/claude-code-agent';

export async function action({ context, request }: ActionFunctionArgs) {
  const { messages } = await request.json<{
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  }>();

  try {
    // Get API keys from environment
    const openrouterKey = context.cloudflare.env.OPENROUTER_API_KEY;
    const e2bKey = context.cloudflare.env.E2B_API_KEY;

    if (!openrouterKey || !e2bKey) {
      throw new Error('Missing API keys: OPENROUTER_API_KEY or E2B_API_KEY');
    }

    // Generate session ID (in production, tie to user/project)
    const sessionId = context.cloudflare.env.SESSION_ID || 'bolt-default-session';

    // Create agent with session ID
    const agent = new ClaudeCodeAgent(openrouterKey, e2bKey, sessionId);

    // Stream response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of agent.streamResponse(messages)) {
            console.log('[E2B API] Event:', event.type);

            switch (event.type) {
              case 'token':
                // Stream tokens immediately (real-time typing)
                const text = event.data.text;
                const escaped = text
                  .replace(/\\/g, '\\\\')
                  .replace(/"/g, '\\"')
                  .replace(/\n/g, '\\n')
                  .replace(/\r/g, '\\r')
                  .replace(/\t/g, '\\t');
                
                controller.enqueue(encoder.encode(`0:"${escaped}"\n`));
                break;

              case 'tool_use':
                // Tool execution started
                console.log('[E2B API] Tool use:', event.data.name);
                const toolMsg = `\n\n🔧 Executing: ${event.data.name}...\n`;
                const toolEscaped = toolMsg
                  .replace(/\\/g, '\\\\')
                  .replace(/"/g, '\\"')
                  .replace(/\n/g, '\\n');
                controller.enqueue(encoder.encode(`0:"${toolEscaped}"\n`));
                break;

              case 'tool_result':
                // Tool execution completed
                console.log('[E2B API] Tool result:', event.data.tool);
                const resultMsg = `✅ ${event.data.tool} completed\n`;
                const resultEscaped = resultMsg
                  .replace(/\\/g, '\\\\')
                  .replace(/"/g, '\\"')
                  .replace(/\n/g, '\\n');
                controller.enqueue(encoder.encode(`0:"${resultEscaped}"\n`));
                break;

              case 'error':
                console.error('[E2B API] Error:', event.data);
                break;

              case 'done':
                console.log('[E2B API] Stream complete');
                break;
            }
          }

          // Cleanup
          await agent.cleanup();
          controller.close();

        } catch (error) {
          console.error('[E2B API] Stream error:', error);
          await agent.cleanup();
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
    console.error('[E2B API] Error:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to process request',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
