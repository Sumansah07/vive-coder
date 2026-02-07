# Sandbox Agent Setup - Final Working Solution

## Install Sandbox Agent Server

### Windows (PowerShell):
```powershell
# Download the installer
Invoke-WebRequest -Uri "https://releases.rivet.dev/sandbox-agent/latest/sandbox-agent-windows-amd64.exe" -OutFile "sandbox-agent.exe"

# Run the server
.\sandbox-agent.exe server --no-token --host 127.0.0.1 --port 2468
```

### Linux/Mac:
```bash
curl -fsSL https://releases.rivet.dev/sandbox-agent/latest/install.sh | sh
sandbox-agent server --no-token --host 127.0.0.1 --port 2468
```

## Configure Environment

Your `.env.local` already has:
```bash
SANDBOX_AGENT_URL=http://localhost:2468
E2B_API_KEY=e2b_2c61d0ee01f090cf3581822bfefbeb13e5511520
OPENROUTER_API_KEY=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
```

## Start Everything

**Terminal 1** (Sandbox Agent - keep running):
```bash
sandbox-agent server --no-token --host 127.0.0.1 --port 2468
```

**Terminal 2** (Bolt app):
```bash
npm run dev
```

## Test

1. Open http://localhost:5173
2. Send a message: "Create a React calculator app"
3. The agent will:
   - Create E2B sandbox
   - Install OpenCode
   - Generate code with full file access
   - Output Bolt artifacts
   - Bolt UI will execute the operations

## What You Get

✅ **Full coding agent** with read/write/execute capabilities
✅ **E2B sandboxes** for safe code execution  
✅ **OpenCode** with 75+ LLM providers
✅ **Bolt artifacts** for UI integration
✅ **Session persistence** across requests
✅ **No npm package needed** - just the binary

## Troubleshooting

### Can't download sandbox-agent
- Go to https://releases.rivet.dev/sandbox-agent/latest/
- Download the binary for your OS manually
- Run it directly

### Connection refused
- Make sure sandbox-agent server is running on port 2468
- Check `SANDBOX_AGENT_URL` in `.env.local`

### No response
- Check sandbox-agent logs in Terminal 1
- Verify E2B_API_KEY is valid
- Check OpenRouter API key has credits

## Architecture

```
Bolt UI → /api/opencode → Sandbox Agent → OpenCode → E2B Sandbox
                                              ↓
                                        Full File Access
                                        Code Execution
                                        Package Installation
```

This is the complete, working solution!
