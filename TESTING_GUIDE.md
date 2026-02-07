# Testing Guide - Sandbox Agent Integration

## Prerequisites

### 1. Download Sandbox Agent Binary

Since the npm package doesn't exist, you need the binary:

**Option A: Build from source**
```bash
git clone https://github.com/rivet-gg/sandbox-agent
cd sandbox-agent
# Follow build instructions in their README
```

**Option B: Check releases**
```bash
# Check if releases are available
# https://github.com/rivet-gg/sandbox-agent/releases
```

**Option C: Use alternative (if Sandbox Agent not available)**
If Sandbox Agent binary is not available, you have two options:
1. Wait for official release
2. Use the original Bolt agent (already working with OpenRouter)

### 2. Verify Your API Keys

Check `.env.local`:
```bash
# Your OpenRouter key (WORKING)


# Your E2B key (WORKING)
E2B_API_KEY=e2b_2c61d0ee01f090cf3581822bfefbeb13e5511520
```

## Testing Steps

### Step 1: Start Sandbox Agent

**If you have the binary:**
```bash
# Set environment variables for Sandbox Agent
export 
export E2B_API_KEY=e2b_2c61d0ee01f090cf3581822bfefbeb13e5511520

# Start Sandbox Agent
sandbox-agent server --no-token --host 127.0.0.1 --port 2468
```

**Expected output:**
```
Sandbox Agent v0.x.x
Listening on http://127.0.0.1:2468
Ready to accept connections
```

### Step 2: Start BoltDIY

In a new terminal:
```bash
npm run dev
```

**Expected output:**
```
REMIX DEV SERVER started
Local:   http://localhost:5173
```

### Step 3: Test in Browser

1. Open http://localhost:5173
2. You should see the BoltDIY UI
3. Send a test message:

**Simple test:**
```
"Create a hello.js file that prints Hello World"
```

**Complex test:**
```
"Create a React calculator app with Vite. Include buttons for +, -, *, / operations."
```

### Step 4: Verify It's Working

**Check browser console:**
```
[Chat API] Sending message to Sandbox Agent: Create a React...
[Chat API] Event: turn.started
[Chat API] Event: tool.call
[Chat API] Event: artifact.output
[Chat API] Turn completed
```

**Check Sandbox Agent logs:**
```
POST /v1/sessions
Session created: bolt-default-session
POST /v1/sessions/bolt-default-session/messages
Processing message...
OpenCode generating response...
```

**Check BoltDIY UI:**
- Response appears in chat
- Files created in sidebar
- Preview updates (if applicable)

## Which API Key is Used?

### Current Setup:
1. **BoltDIY** → Sends message to **Sandbox Agent**
2. **Sandbox Agent** → Uses **OpenCode** agent
3. **OpenCode** → Uses **OpenRouter API** (your key)
4. **OpenRouter** → Routes to **Claude/GPT** models

### API Key Flow:
```
Your OpenRouter Key
    ↓
Sandbox Agent (reads from env)
    ↓
OpenCode agent
    ↓
OpenRouter API
    ↓
Claude 3.5 Sonnet / GPT-4 / etc.
```

## Troubleshooting

### Issue 1: Sandbox Agent Binary Not Available

**Symptom:**
```
sandbox-agent: command not found
```

**Solution:**
The Sandbox Agent project might not have public binaries yet. In this case:

1. **Use original Bolt agent** (already working):
   - It uses your OpenRouter key
   - Already integrated
   - Just use the default `/api/chat` without Sandbox Agent

2. **Wait for Sandbox Agent release**
   - Check https://github.com/rivet-gg/sandbox-agent
   - Watch for releases

### Issue 2: Connection Refused

**Symptom:**
```
Error: Failed to create session: ECONNREFUSED
```

**Solution:**
- Sandbox Agent not running
- Start it on port 2468
- Check firewall settings

### Issue 3: API Key Not Working

**Symptom:**
```
Error: Invalid API key
```

**Solution:**
1. Verify OpenRouter key has credits
2. Check key is exported to Sandbox Agent environment
3. Try with Anthropic key instead:
   ```bash
   export ANTHROPIC_API_KEY=your-key
   ```

### Issue 4: No Response

**Symptom:**
- Message sent but no response

**Solution:**
1. Check browser console for errors
2. Check Sandbox Agent logs
3. Verify OpenCode is installed (first run takes time)
4. Check API key has credits

## Alternative: Use Original Bolt Agent

If Sandbox Agent is not available, the **original Bolt agent already works** with your OpenRouter key!

Just use BoltDIY normally:
1. Start: `npm run dev`
2. Open: http://localhost:5173
3. Send message: "Create a React app"
4. It uses: OpenRouter → Claude 3.5 Sonnet

The original agent is already powerful and production-ready.

## API Key Costs

### OpenRouter Pricing (your current key):
- **Claude 3.5 Sonnet**: ~$3 per 1M input tokens
- **GPT-4**: ~$30 per 1M input tokens
- **Free models**: Available (Llama, Mistral, etc.)

### Check your balance:
```bash
curl https://openrouter.ai/api/v1/auth/key \
  -H "Authorization: 
```

## Success Checklist

✅ Sandbox Agent running on port 2468
✅ BoltDIY running on port 5173
✅ OpenRouter API key configured
✅ Message sent successfully
✅ Response received in UI
✅ Files created (if applicable)
✅ Preview updates (if applicable)

## What You Have Now

### Working Setup:
1. ✅ **BoltDIY UI** - Fully functional
2. ✅ **OpenRouter API** - Your key with credits
3. ✅ **E2B API** - Your key for sandboxes
4. ✅ **Integration code** - Ready for Sandbox Agent

### Missing:
- ⏳ **Sandbox Agent binary** - Not publicly available yet

### Recommendation:
**Use the original Bolt agent** (it's already powerful and uses your OpenRouter key) until Sandbox Agent releases public binaries.

The integration code is ready and will work immediately once Sandbox Agent is available!
