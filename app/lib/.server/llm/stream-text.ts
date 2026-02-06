import { streamText as _streamText, convertToCoreMessages } from 'ai';
import { getAPIKey, getBaseURL } from '~/lib/.server/llm/api-key';
import { getAnthropicModel, getOpenRouterModel } from '~/lib/.server/llm/model';
import { MAX_TOKENS } from './constants';
import { getSystemPrompt } from './prompts';

interface ToolResult<Name extends string, Args, Result> {
  toolCallId: string;
  toolName: Name;
  args: Args;
  result: Result;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: ToolResult<string, unknown, unknown>[];
}

export type Messages = Message[];

export type StreamingOptions = Omit<Parameters<typeof _streamText>[0], 'model'>;

export function streamText(messages: Messages, env: Env, options?: StreamingOptions) {
  const apiKey = getAPIKey(env);
  const baseURL = getBaseURL(env);
  
  // Use OpenRouter if OPENROUTER_API_KEY is set, otherwise use Anthropic
  const useOpenRouter = baseURL || process.env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY;
  const model = useOpenRouter
    ? getOpenRouterModel(apiKey || '', baseURL)
    : getAnthropicModel(apiKey || '');

  return _streamText({
    model: model as any,
    system: getSystemPrompt(),
    maxTokens: MAX_TOKENS,
    messages: convertToCoreMessages(messages as any),
    ...options,
  });
}
