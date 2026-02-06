# Daytona OpenCode Integration - Complete Setup

## ✅ What's Been Configured

### 1. Dual AI System
- **OpenRouter AI** - For chat interface and general responses
- **Daytona OpenCode** - For code generation and execution in E2B sandboxes

### 2. API Keys Configured
```env
OPENROUTER_API_KEY=sk-or-v1-... (for chat AI)
E2B_API_KEY=e2b_2c61d0ee01f090cf3581822bfefbeb13e5511520 (for Daytona/E2B)
```

### 3. Files Created
- `app/lib/.server/daytona/opencode.ts` - OpenCode agent integration
- `app/routes/api.opencode.ts` - API endpoint for OpenCode
- TypeScript types updated

## 🎯 How It Works

### Architecture Flow

```
User Message
    ↓
OpenRouter AI (Chat Response)
    ↓
Daytona OpenCode Agent
    ↓
E2B Sandbox (Code Execution)
    ↓
Results Back to User
```

### Dual AI Benefits

1. **OpenRouter** handles:
   - Natural conversation
   - Explaining concepts
   - Answering questions
   - Planning approach

2. **Daytona OpenCode** handles:
   - Generating code
   - Creating files
   - Running commands
   - Setting up projects
   - Debugging in sandbox

## 📡 API Endpoints

### Current Chat (OpenRouter)
```
POST /api/chat
- Uses OpenRouter AI
- Streams responses
- General conversation
```

### New OpenCode Endpoint
```
POST /api/opencode
- Uses Daytona OpenCode agent
- Executes in E2B sandbox
- Returns files, commands, sandbox URL
```

## 🔧 Usage Examples

### Example 1: Using OpenCode for Code Generation

```typescript
// Frontend call
const response = await fetch('/api/opencode', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      {
        role: 'user',
        content: 'Create a React counter app with TypeScript',
      },
    ],
  }),
});

const result = await response.json();
// result.files - Array of generated files
// result.commands - Commands that were run
// result.sandboxUrl - Live preview URL
// result.message - AI explanation
```

### Example 2: Hybrid Approach

```typescript
// 1. Ask OpenRouter AI for planning
const plan = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'How should I build a todo app?' }],
  }),
});

// 2. Use OpenCode to actually build it
const implementation = await fetch('/api/opencode', {
  method: 'POST',
  body: JSON.stringify({
    messages: [
      {
        role: 'user',
        content: 'Build a todo app with React, TypeScript, and Tailwind',
      },
    ],
  }),
});
```

## 🚀 Integration Options

### Option A: Replace WebContainer Entirely

Modify `app/lib/runtime/action-runner.ts` to use OpenCode instead of WebContainer:

```typescript
// Instead of WebContainer
import { callOpenCodeAgent } from '~/lib/.server/daytona/opencode';

async function executeAction(action: BoltAction) {
  if (action.type === 'file') {
    // Use OpenCode to create files in E2B
    await callOpenCodeAgent([
      {
        role: 'user',
        content: `Create file ${action.filePath} with content: ${action.content}`,
      },
    ], env);
  }
}
```

### Option B: Smart Routing (Recommended)

Use OpenCode for complex tasks, WebContainer for simple ones:

```typescript
function shouldUseOpenCode(prompt: string): boolean {
  const complexKeywords = [
    'install',
    'deploy',
    'database',
    'api',
    'backend',
    'full-stack',
  ];
  
  return complexKeywords.some(keyword => 
    prompt.toLowerCase().includes(keyword)
  );
}

// In chat handler
if (shouldUseOpenCode(userMessage)) {
  // Use Daytona OpenCode
  return await callOpenCodeAgent(messages, env);
} else {
  // Use regular OpenRouter + WebContainer
  return await streamText(messages, env);
}
```

### Option C: Parallel Processing

Use both simultaneously:

```typescript
// Get AI response from OpenRouter
const aiResponse = streamText(messages, env);

// Execute code in OpenCode/E2B
const execution = callOpenCodeAgent(messages, env);

// Combine results
return {
  explanation: aiResponse,
  implementation: execution,
};
```

## 🔑 Daytona OpenCode API Details

### Endpoint
```
POST https://api.daytona.io/v1/opencode/chat
```

### Headers
```
Content-Type: application/json
Authorization: Bearer <E2B_API_KEY>
```

### Request Body
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Create a React app"
    }
  ],
  "e2b_api_key": "e2b_...",
  "stream": false
}
```

### Response
```json
{
  "message": "I've created a React app...",
  "files": [
    {
      "path": "/app/src/App.tsx",
      "content": "import React..."
    }
  ],
  "commands": [
    "npm install",
    "npm run dev"
  ],
  "sandbox_url": "https://xyz.e2b.dev"
}
```

## 🎨 UI Integration

### Add OpenCode Button

```tsx
// In Chat component
<button
  onClick={async () => {
    const result = await fetch('/api/opencode', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    });
    
    const data = await result.json();
    
    // Show files in editor
    data.files.forEach(file => {
      workbenchStore.addFile(file.path, file.content);
    });
    
    // Show preview
    if (data.sandboxUrl) {
      window.open(data.sandboxUrl, '_blank');
    }
  }}
>
  🚀 Execute in Cloud Sandbox
</button>
```

## 📊 Cost Comparison

### Current Setup (WebContainer)
- ✅ Free
- ❌ Browser limitations
- ❌ No backend support

### With Daytona OpenCode + E2B
- ✅ Full Linux environment
- ✅ Backend support
- ✅ Real dev tools
- 💰 E2B: $0.15/hour (100 hours free/month)
- 💰 Daytona: Check pricing

## 🧪 Testing the Integration

### Test 1: Simple Code Generation
```bash
curl -X POST http://localhost:5173/api/opencode \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Create a simple HTML page with a button"
      }
    ]
  }'
```

### Test 2: Full Stack App
```bash
curl -X POST http://localhost:5173/api/opencode \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Create a Node.js Express API with a /hello endpoint"
      }
    ]
  }'
```

## 🔄 Migration Path

### Phase 1: Testing (Current)
- Keep WebContainer as default
- Add OpenCode as optional feature
- Test with simple projects

### Phase 2: Hybrid
- Use OpenCode for complex tasks
- Keep WebContainer for simple edits
- Smart routing based on task

### Phase 3: Full Migration
- Replace WebContainer entirely
- All execution in E2B
- Better performance

## 🐛 Troubleshooting

### Error: "E2B_API_KEY is required"
- Check `.env.local` has the key
- Restart dev server

### Error: "OpenCode API failed"
- Verify E2B key is valid
- Check Daytona API status
- Try with simpler prompt

### No sandbox URL returned
- Some tasks don't need preview
- Check if dev server was started
- Look in `commands` array

## 📚 Resources

- Daytona Docs: https://www.daytona.io/docs
- OpenCode Guide: https://www.daytona.io/docs/en/guides/opencode/opencode-web-agent/
- E2B Docs: https://e2b.dev/docs
- E2B Dashboard: https://e2b.dev/dashboard

## 🎯 Next Steps

1. **Test the integration:**
   ```bash
   pnpm run dev
   # Try the /api/opencode endpoint
   ```

2. **Choose integration approach:**
   - Option A: Full replacement
   - Option B: Smart routing (recommended)
   - Option C: Parallel processing

3. **Update UI:**
   - Add "Execute in Cloud" button
   - Show sandbox preview
   - Display generated files

4. **Monitor usage:**
   - Track E2B hours
   - Set up billing alerts
   - Optimize sandbox lifecycle

**Ready to implement! Which integration option do you prefer?**
