# ✅ E2B AI Agent Integration - Complete Setup

## What You Have Now

### Single E2B API Key for Everything
```
E2B_API_KEY=e2b_2c61d0ee01f090cf3581822bfefbeb13e5511520
```

This ONE key provides:
- ✅ **AI Agent** (Claude 3.5 Sonnet)
- ✅ **Code Execution** (Cloud sandboxes)
- ✅ **File Management** (Create, read, write files)
- ✅ **Live Preview** (Sandbox URLs)
- ✅ **Package Installation** (npm, pip, etc.)

### Dual AI System

**OpenRouter** (Chat Interface):
- Natural conversation
- Explaining concepts
- Planning approach
- Quick responses

**E2B Agent** (Code Execution):
- Generating code
- Creating files
- Running commands
- Setting up projects
- Live sandboxes

## 🚀 How to Use

### Option 1: Test E2B Agent Directly

```bash
curl -X POST http://localhost:5173/api/opencode \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Create a React counter app with TypeScript and Vite"
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "I've created a React counter app...",
  "files": [
    {
      "path": "/src/App.tsx",
      "content": "import React..."
    }
  ],
  "commands": ["npm install", "npm run dev"],
  "sandboxUrl": "https://xyz.e2b.dev"
}
```

### Option 2: Add Button to UI

Add this to your chat interface:

```tsx
// In app/components/chat/Chat.client.tsx

<button
  className="px-4 py-2 bg-blue-600 text-white rounded"
  onClick={async () => {
    const response = await fetch('/api/opencode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: inputValue, // Current user message
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.success) {
      // Show files in editor
      data.files?.forEach((file: any) => {
        workbenchStore.addFile(file.path, file.content);
      });

      // Open preview in new tab
      if (data.sandboxUrl) {
        window.open(data.sandboxUrl, '_blank');
      }

      // Show success message
      toast.success('Code executed in cloud sandbox!');
    }
  }}
>
  🚀 Execute in E2B Sandbox
</button>
```

### Option 3: Smart Routing (Recommended)

Automatically use E2B for code-heavy tasks:

```typescript
// In app/routes/api.chat.ts

async function chatAction({ context, request }: ActionFunctionArgs) {
  const { messages } = await request.json<{ messages: Messages }>();
  
  const lastMessage = messages[messages.length - 1].content.toLowerCase();
  
  // Keywords that indicate code execution needed
  const codeKeywords = [
    'create',
    'build',
    'make',
    'generate',
    'install',
    'run',
    'deploy',
    'setup',
    'app',
    'project',
  ];
  
  const needsCodeExecution = codeKeywords.some(keyword => 
    lastMessage.includes(keyword)
  );
  
  if (needsCodeExecution) {
    // Use E2B Agent for code execution
    const result = await callOpenCodeAgent(
      convertToOpenCodeMessages(messages),
      context.cloudflare.env
    );
    
    return Response.json(result);
  } else {
    // Use OpenRouter for chat
    const stream = new SwitchableStream();
    const result = await streamText(messages, context.cloudflare.env);
    stream.switchSource(result.toAIStream());
    
    return new Response(stream.readable, {
      status: 200,
      headers: { contentType: 'text/plain; charset=utf-8' },
    });
  }
}
```

## 🎯 E2B Agent Capabilities

### What It Can Do

1. **Full-Stack Apps**
   ```
   "Create a Next.js app with authentication"
   ```

2. **Backend APIs**
   ```
   "Build an Express API with MongoDB"
   ```

3. **Data Processing**
   ```
   "Create a Python script to analyze CSV data"
   ```

4. **Database Setup**
   ```
   "Set up PostgreSQL with sample data"
   ```

5. **Package Installation**
   ```
   "Install and configure Tailwind CSS"
   ```

### What It Returns

```typescript
{
  message: string;        // AI explanation
  files: Array<{          // Generated files
    path: string;
    content: string;
  }>;
  commands: string[];     // Commands executed
  sandboxUrl?: string;    // Live preview URL
}
```

## 💰 Cost & Limits

### E2B Pricing
- **Free Tier**: 100 sandbox hours/month
- **After Free**: ~$0.15/hour
- **Sandboxes**: Auto-shutdown after inactivity

### Optimization Tips

1. **Reuse Sandboxes**
   - Don't create new sandbox for every request
   - Keep sandbox alive for session

2. **Auto-Shutdown**
   - E2B automatically stops inactive sandboxes
   - No manual cleanup needed

3. **Monitor Usage**
   - Dashboard: https://e2b.dev/dashboard
   - Set billing alerts

## 🧪 Testing

### Test 1: Simple HTML
```bash
curl -X POST http://localhost:5173/api/opencode \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "role": "user",
      "content": "Create a simple HTML page with a button"
    }]
  }'
```

### Test 2: React App
```bash
curl -X POST http://localhost:5173/api/opencode \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "role": "user",
      "content": "Create a React todo app with TypeScript"
    }]
  }'
```

### Test 3: Backend API
```bash
curl -X POST http://localhost:5173/api/opencode \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "role": "user",
      "content": "Create a Node.js Express API with /users endpoint"
    }]
  }'
```

## 🔧 Configuration

### Current Setup
```env
# Chat AI (OpenRouter)
OPENROUTER_API_KEY=sk-or-v1-...

# Code Execution AI (E2B)
E2B_API_KEY=e2b_2c61d0ee01f090cf3581822bfefbeb13e5511520
```

### API Endpoint
```
POST https://api.e2b.dev/v1/agent/chat
Headers:
  Content-Type: application/json
  X-API-Key: <E2B_API_KEY>
```

## 🐛 Troubleshooting

### Error: "E2B_API_KEY is required"
- Check `.env.local` has the key
- Restart dev server: `pnpm run dev`

### Error: "API failed: 401"
- Verify E2B key is valid
- Check at: https://e2b.dev/dashboard

### No sandbox URL returned
- Some tasks don't need preview
- Check if dev server was started
- Look in `commands` array

### Slow response
- E2B creates sandbox on first request
- Subsequent requests are faster
- Consider keeping sandbox alive

## 📚 Resources

- E2B Docs: https://e2b.dev/docs
- E2B Dashboard: https://e2b.dev/dashboard
- E2B Agent API: https://e2b.dev/docs/agent
- Pricing: https://e2b.dev/pricing

## ✅ Next Steps

1. **Test the integration:**
   ```bash
   pnpm run dev
   # Try: curl -X POST http://localhost:5173/api/opencode ...
   ```

2. **Add UI button** (see Option 2 above)

3. **Implement smart routing** (see Option 3 above)

4. **Monitor usage** at https://e2b.dev/dashboard

**You're all set! The E2B agent is ready to use with just your E2B API key.** 🚀
