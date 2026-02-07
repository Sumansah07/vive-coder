import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { streamText } from '~/lib/.server/llm/stream-text';

export async function action({ context, request }: ActionFunctionArgs) {
  const { messages } = await request.json<{
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  }>();

  try {
    const result = await streamText(messages, context.cloudflare.env);
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to process chat request',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}