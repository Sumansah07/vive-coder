# Sandbox Agent + OpenCode Integration

## Overview

This integration uses **Sandbox Agent** (sandboxagent.dev) with **OpenCode** and **E2B sandboxes** to provide full coding agent capabilities:

- ✅ Read/write files
- ✅ Execute code
- ✅ Index codebase
- ✅ Install packages
- ✅ Run servers
- ✅ Full project modification

## Architecture

```
Bolt UI → API Route → Sandbox Agent → OpenCode → E2B Sandbox
```

## Setup

### 1. Install Sandbox Agent

```bash
npm install -g @sandboxagent/cli
```

Or use npx:
```bash
npx @sandboxagent/cli server
```

### 2. Start Sandbox Agent Server

```bash
sandbox-agent server --no-token --host 127.0.0.1 --port 2468
```

With E2B:
```bash
E2B_API_KEY=your_e2b_key sandbox-agent server --no-token --host 127.0.0.1 --port 2468
```

### 3. Configure Environment

Add to `.env.local`:
```bash
SANDBOX_AGENT_URL=http://localhost:2468
E2B_API_KEY=e2b_2c61d0ee01f090cf3581822bfefbeb13e5511520
```

### 4. Start Bolt

```bash
npm run dev
```

## How It Works

1. **User sends message** in Bolt UI
2. **API route** forwards to Sandbox Agent at `/opencode` endpoint
3. **Sandbox Agent** creates/manages E2B sandbox
4. **OpenCode** runs inside sandbox with full file system access
5. **Agent executes operations** (read/write/execute)
6. **Response** streams back to Bolt UI

## Features

### Full Coding Capabilities

OpenCode running in E2B sandbox has:
- Complete file system access
- Code execution (Node.js, Python, etc.)
- Package installation (npm, pip)
- Git operations
- Server/app deployment

### Bolt Artifact Support

The agent is configured to output Bolt artifacts:
```xml
<boltArtifact id="project-id" title="Project Title">
  <boltAction type="file" filePath="src/app.js">
  // Complete file content
  </boltAction>
  
  <boltAction type="shell">
  npm install && npm run dev
  </boltAction>
</boltArtifact>
```

### Session Management

- Sessions persist across requests
- Conversation history maintained
- Sandbox state preserved

## Advantages Over Previous Approach

| Feature | Daytona CLI | Sandbox Agent |
|---------|-------------|---------------|
| File Operations | ❌ Limited | ✅ Full access |
| Code Execution | ❌ Via CLI | ✅ Native |
| API | ❌ CLI only | ✅ HTTP/WebSocket |
| Session Management | ❌ Manual | ✅ Automatic |
| Conversation History | ❌ Manual | ✅ Built-in |
| Bolt Artifacts | ❌ Manual | ✅ Supported |

## Troubleshooting

### Sandbox Agent not connecting

Check that:
1. Sandbox Agent server is running on port 2468
2. `SANDBOX_AGENT_URL` is set correctly
3. No firewall blocking localhost:2468

### E2B sandbox errors

Verify:
1. `E2B_API_KEY` is valid
2. E2B account has credits
3. Check E2B dashboard for sandbox status

### No response from agent

1. Check Sandbox Agent logs
2. Verify OpenCode is installed in sandbox
3. Check network connectivity

## Production Deployment

For production, run Sandbox Agent as a service:

```bash
# Using PM2
pm2 start "sandbox-agent server --token $SANDBOX_TOKEN --host 0.0.0.0 --port 2468" --name sandbox-agent

# Using systemd
# Create /etc/systemd/system/sandbox-agent.service
```

Set `SANDBOX_AGENT_URL` to your production URL.

## References

- [Sandbox Agent Docs](https://sandboxagent.dev/docs)
- [OpenCode Docs](https://opencode.ai/docs)
- [E2B Docs](https://e2b.dev/docs)
