# Sandbox Agent Integration - Complete

## What Was Changed

### ✅ REMOVED
- `app/lib/.server/llm/stream-text.ts` usage in `/api/chat`
- Direct Anthropic/OpenAI LLM calls
- Internal prompt templates
- Tool parsing logic

### ✅ ADDED
- `app/lib/.server/sandbox-agent/http-client.ts` - Direct HTTP client for Sandbox Agent
- Replaced `/api/chat` to forward messages to Sandbox Agent
- Session management with OpenCode agent
- Event streaming from Sandbox Agent to UI

### ✅ PRESERVED
- All UI components (chat, editor, preview)
- Artifact rendering logic
- File system operations
- Preview iframe functionality
- Vercel AI SDK streaming format compatibility

## Architecture

```
BoltDIY UI → /api/chat → Sandbox Agent (OpenCode) → Response Stream → UI
```

## Setup Instructions

### 1. Start Sandbox Agent Server

```bash
# Download from https://github.com/rivet-gg/sandbox-agent/releases
# Or build from source

sandbox-agent server --no-token --host 127.0.0.1 --port 2468
```

### 2. Configure Environment (Optional)

Add to `.env.local` if using custom URL:
```bash
SANDBOX_AGENT_URL=http://127.0.0.1:2468
SESSION_ID=my-custom-session
```

### 3. Start BoltDIY

```bash
npm run dev
```

### 4. Test

1. Open http://localhost:5173
2. Send message: "Create a React calculator app"
3. Sandbox Agent (OpenCode) will:
   - Generate code with full file access
   - Create files
   - Run commands
   - Stream results back to UI

## How It Works

### Session Management
- Each project/chat gets a unique session ID
- Sessions persist across messages
- Agent: `opencode`
- Mode: `build`
- Permissions: `default`

### Message Flow
1. User sends message in UI
2. `/api/chat` receives message
3. Creates/reuses Sandbox Agent session
4. Posts message to session
5. Streams events back to UI
6. UI renders response

### Event Mapping
- `message` events → Text content in chat
- `done` events → Stream completion
- `error` events → Error handling

## Validation

✅ No direct LLM calls in codebase
✅ All messages go through Sandbox Agent
✅ UI components unchanged
✅ Artifacts still render
✅ Preview still works
✅ File operations delegated to agent

## Troubleshooting

### Sandbox Agent not running
```
Error: Failed to create session: ECONNREFUSED
```
**Solution**: Start Sandbox Agent server on port 2468

### Session not found
```
Error: Failed to get session: 404
```
**Solution**: Session is auto-created on first message

### No response
**Check**: Sandbox Agent logs for errors
**Check**: OpenCode agent is installed (lazy install on first use)

## Next Steps

- Add proper session ID management (per user/project)
- Add session cleanup/deletion
- Add error recovery
- Add timeout handling
- Add progress indicators for long operations

## Success Criteria

✅ BoltDIY UI works unchanged
✅ Messages processed by Sandbox Agent
✅ OpenCode generates code
✅ Files created correctly
✅ Preview updates
✅ No internal AI agent logic remains
