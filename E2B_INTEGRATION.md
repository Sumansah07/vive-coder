# E2B Sandbox Integration Guide

## What is E2B?

E2B provides cloud-based sandboxes for running code securely. Unlike WebContainers (browser-based), E2B sandboxes run in the cloud with:

✅ **Better Performance** - Real VMs, not browser limitations
✅ **More Power** - Full Linux environment with all tools
✅ **Persistent Storage** - Files persist across sessions
✅ **Network Access** - Can install packages, make API calls
✅ **Multiple Languages** - Python, Node.js, Go, Rust, etc.

## Integration Status

### ✅ Completed
- E2B SDK installed (`@e2b/code-interpreter`)
- E2B API key configured in `.env.local`
- Sandbox utility functions created (`app/lib/.server/e2b/sandbox.ts`)
- TypeScript types updated

### 🔄 Next Steps (Choose Your Approach)

## Option 1: Replace WebContainer with E2B (Recommended)

This replaces the browser-based WebContainer with cloud sandboxes.

**Pros:**
- Better performance
- No browser limitations
- Real dev environment
- Works on any device

**Cons:**
- Requires internet connection
- Costs money (after free tier)
- Slightly higher latency

**Implementation:**
1. Modify `app/lib/runtime/action-runner.ts` to use E2B instead of WebContainer
2. Update file operations to use E2B file system
3. Modify preview to use E2B sandbox URLs
4. Update terminal to connect to E2B sandbox

## Option 2: Daytona OpenCode Agent Integration

Use Daytona's OpenCode agent for AI reasoning, then execute in E2B.

**Pros:**
- More powerful AI agent
- Better code generation
- Specialized for coding tasks
- Can use multiple AI models

**Cons:**
- More complex setup
- Requires Daytona API access
- Additional service dependency

**Implementation:**
1. Install Daytona SDK
2. Replace AI chat logic with OpenCode agent
3. Connect agent output to E2B sandbox
4. Update UI to show agent reasoning

## Option 3: Hybrid Approach

Keep WebContainer for simple tasks, use E2B for complex ones.

**Pros:**
- Best of both worlds
- Fallback option
- Gradual migration

**Cons:**
- More complex codebase
- Need to manage both systems

## Current Setup

Your E2B API key is configured:
```
E2B_API_KEY=e2b_2c61d0ee01f090cf3581822bfefbeb13e5511520
```

### Available Functions

```typescript
// Create/get sandbox
const sandbox = await getE2BSandbox(env);

// Execute code
const result = await executeInSandbox('console.log("Hello")', env);

// Run shell commands
const result = await runCommandInSandbox('npm install', env);

// File operations
await writeFileInSandbox('/app/index.js', code, env);
const file = await readFileFromSandbox('/app/index.js', env);
const files = await listFilesInSandbox('/app', env);

// Get preview URL
const url = await getSandboxUrl(env);
```

## Quick Test

To test E2B integration, create a test route:

```typescript
// app/routes/api.test-e2b.ts
import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { executeInSandbox } from '~/lib/.server/e2b/sandbox';

export async function action({ context }: ActionFunctionArgs) {
  const result = await executeInSandbox(
    'print("Hello from E2B!")',
    context.cloudflare.env
  );
  
  return Response.json(result);
}
```

## Daytona OpenCode Integration

To integrate Daytona's OpenCode agent:

1. **Install Daytona SDK:**
```bash
pnpm add @daytona/sdk
```

2. **Configure Daytona:**
```env
DAYTONA_API_KEY=your_daytona_key
DAYTONA_WORKSPACE_URL=your_workspace_url
```

3. **Replace AI Agent:**
Instead of calling OpenRouter directly, use OpenCode agent:

```typescript
import { DaytonaClient } from '@daytona/sdk';

const client = new DaytonaClient({
  apiKey: env.DAYTONA_API_KEY,
});

// Use OpenCode agent
const response = await client.opencode.chat({
  messages: userMessages,
  sandbox: sandboxId, // E2B sandbox ID
});
```

## Cost Comparison

### WebContainer (Current)
- ✅ Free
- ✅ No API costs
- ❌ Browser limitations
- ❌ Limited performance

### E2B Sandbox
- ✅ Free tier: 100 hours/month
- ✅ Better performance
- ✅ Full Linux environment
- 💰 $0.15/hour after free tier

### Daytona OpenCode
- Check pricing at: https://www.daytona.io/pricing
- Typically usage-based

## Recommended Next Steps

1. **Test E2B Integration:**
   - Create test route
   - Verify sandbox creation
   - Test file operations

2. **Decide on Architecture:**
   - Full E2B replacement?
   - Daytona OpenCode agent?
   - Hybrid approach?

3. **Implement Gradually:**
   - Start with file operations
   - Then command execution
   - Finally preview integration

4. **Monitor Costs:**
   - Track E2B usage
   - Set up billing alerts
   - Optimize sandbox lifecycle

## Resources

- E2B Docs: https://e2b.dev/docs
- Daytona Docs: https://www.daytona.io/docs
- OpenCode Guide: https://www.daytona.io/docs/en/guides/opencode/opencode-web-agent/

## Need Help?

Let me know which approach you want to take, and I'll help you implement it step by step!
