import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';

export function getAnthropicModel(apiKey: string) {
  const anthropic = createAnthropic({
    apiKey,
  });

  return anthropic('claude-3-5-sonnet-20240620');
}

export function getOpenRouterModel(apiKey: string, baseURL?: string) {
  const openrouter = createOpenAI({
    apiKey,
    baseURL: baseURL || 'https://openrouter.ai/api/v1',
    headers: {
      'HTTP-Referer': 'https://bolt.new',
      'X-Title': 'Bolt',
    },
  });

  // Using OpenAI format model name for better compatibility
  return openrouter('anthropic/claude-3.5-sonnet');
}
