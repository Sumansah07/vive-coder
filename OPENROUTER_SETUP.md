# OpenRouter Setup Guide

This Bolt.new codebase has been configured to work with OpenRouter API, allowing you to use various AI models without needing a direct Anthropic API key.

## Quick Setup

### 1. Get Your OpenRouter API Key

1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up or log in
3. Navigate to [Keys](https://openrouter.ai/keys)
4. Create a new API key

### 2. Configure Environment Variables

Open the `.env.local` file in the root directory and replace `your_openrouter_api_key_here` with your actual OpenRouter API key:

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxx
```

### 3. Choose Your Model (Optional)

By default, the app uses `anthropic/claude-3.5-sonnet` through OpenRouter. To use a different model, edit `app/lib/.server/llm/model.ts`:

```typescript
export function getOpenRouterModel(apiKey: string, baseURL?: string) {
  const openrouter = createOpenAI({
    apiKey,
    baseURL: baseURL || 'https://openrouter.ai/api/v1',
  });

  // Change this to any model available on OpenRouter
  return openrouter('anthropic/claude-3.5-sonnet');
}
```

### Popular OpenRouter Models:

- `anthropic/claude-3.5-sonnet` (default, best for coding)
- `anthropic/claude-3-opus`
- `openai/gpt-4-turbo`
- `openai/gpt-4o`
- `google/gemini-pro-1.5`
- `meta-llama/llama-3.1-405b-instruct`

See all available models at: https://openrouter.ai/models

### 4. Start the Development Server

```bash
pnpm run dev
```

The app will now use OpenRouter instead of direct Anthropic API!

## How It Works

The code automatically detects if `OPENROUTER_API_KEY` is set:
- If present → Uses OpenRouter
- If not present → Falls back to Anthropic (requires `ANTHROPIC_API_KEY`)

## Switching Back to Anthropic

If you later get an Anthropic API key and want to use it directly:

1. Comment out or remove `OPENROUTER_API_KEY` in `.env.local`
2. Add `ANTHROPIC_API_KEY=your_key_here`
3. Restart the dev server

## Cost Tracking

OpenRouter provides built-in cost tracking and usage limits. Check your usage at:
https://openrouter.ai/activity

## Troubleshooting

### "Insufficient credits" error
- Add credits to your OpenRouter account at https://openrouter.ai/credits

### Model not responding
- Check if the model is available on OpenRouter
- Verify your API key is correct
- Check OpenRouter status at https://openrouter.ai/status

### Rate limiting
- OpenRouter has rate limits per model
- Consider upgrading your OpenRouter plan or switching to a different model

## Additional Configuration

### Custom Base URL
If you're using a proxy or custom OpenRouter endpoint:

```env
OPENROUTER_API_BASE=https://your-custom-endpoint.com/api/v1
```

### Debug Logging
Enable detailed logs to troubleshoot issues:

```env
VITE_LOG_LEVEL=debug
```

## Support

- OpenRouter Docs: https://openrouter.ai/docs
- OpenRouter Discord: https://discord.gg/openrouter
- Bolt.new Issues: https://github.com/stackblitz/bolt.new/issues
