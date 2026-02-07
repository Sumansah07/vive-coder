/**
 * Direct E2B + OpenCode Integration
 * 
 * Uses E2B API directly to run OpenCode with full capabilities
 */

import { env } from 'node:process';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

let sandboxId: string | undefined;

/**
 * Create or get E2B sandbox
 */
async function getOrCreateSandbox(cloudflareEnv: Env): Promise<string> {
  if (sandboxId) {
    return sandboxId;
  }

  const e2bApiKey = env.E2B_API_KEY || cloudflareEnv.E2B_API_KEY;
  if (!e2bApiKey) {
    throw new Error('E2B_API_KEY is required');
  }

  console.log('[E2B OpenCode] Creating sandbox...');

  // Create E2B sandbox using correct API format
  const response = await fetch('https://api.e2b.dev/sandboxes', {
    method: 'POST',
    headers: {
      'X-API-Key': e2bApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      templateID: 'base',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[E2B OpenCode] API Error:', errorText);
    throw new Error(`Failed to create E2B sandbox: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as any;
  console.log('[E2B OpenCode] API Response:', JSON.stringify(data));
  
  // E2B returns different field names depending on API version
  sandboxId = data.sandboxID || data.sandboxId || data.id || data.sandbox_id;

  if (!sandboxId) {
    throw new Error('No sandbox ID in response: ' + JSON.stringify(data));
  }

  console.log('[E2B OpenCode] Sandbox created:', sandboxId);

  // Install OpenCode in the sandbox
  await executeInSandbox(sandboxId, e2bApiKey, 'npm install -g opencode-ai@1.1.1');

  return sandboxId;
}

/**
 * Execute command in E2B sandbox
 */
async function executeInSandbox(
  sid: string,
  apiKey: string,
  command: string,
): Promise<string> {
  const response = await fetch(`https://api.e2b.dev/v2/sandboxes/${sid}/commands`, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      command: command,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to execute command: ${response.status}`);
  }

  const data = await response.json() as { stdout?: string; stderr?: string };
  return data.stdout || '';
}

/**
 * Send message to OpenCode running in E2B
 */
export async function sendToE2BOpenCode(
  messages: Message[],
  cloudflareEnv: Env,
): Promise<string> {
  const e2bApiKey = env.E2B_API_KEY || cloudflareEnv.E2B_API_KEY;
  const openRouterApiKey = env.OPENROUTER_API_KEY || cloudflareEnv.OPENROUTER_API_KEY;

  if (!e2bApiKey) {
    throw new Error('E2B_API_KEY is required');
  }

  const sid = await getOrCreateSandbox(cloudflareEnv);

  // Get last message
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') {
    throw new Error('No user message found');
  }

  console.log('[E2B OpenCode] Sending message...');

  // Build system prompt for Bolt artifacts
  const systemPrompt = `You are a powerful AI coding agent with FULL file system access in an E2B sandbox.

CRITICAL: Output Bolt artifacts for ALL code/file operations:

<boltArtifact id="unique-id" title="Title">
  <boltAction type="file" filePath="path/to/file.js">
  COMPLETE file content - NO placeholders
  </boltAction>
  
  <boltAction type="shell">
  npm install && npm run dev
  </boltAction>
</boltArtifact>

You have FULL access to:
- Read/write ANY file
- Execute ANY command
- Install packages
- Run servers
- Modify projects

Working directory: /home/user
Available: node, npm, python3, git, curl

BE CONCISE. Output artifacts immediately.`;

  // Combine system prompt with user message
  const fullPrompt = `${systemPrompt}\n\nUser: ${lastMessage.content}`;

  // Write prompt to file
  const promptFile = `/tmp/prompt-${Date.now()}.txt`;
  await executeInSandbox(sid, e2bApiKey, `cat > ${promptFile} << 'EOF'\n${fullPrompt}\nEOF`);

  // Run OpenCode with the prompt
  const command = openRouterApiKey
    ? `OPENROUTER_API_KEY="${openRouterApiKey}" opencode run --format json --model opencode/gpt-5-nano --file ${promptFile}`
    : `opencode run --format json --model opencode/gpt-5-nano --file ${promptFile}`;

  const result = await executeInSandbox(sid, e2bApiKey, command);

  console.log('[E2B OpenCode] Got response, length:', result.length);

  // Parse JSON response
  let response = '';
  const lines = result.split('\n').filter(line => line.trim());

  for (const line of lines) {
    try {
      const event = JSON.parse(line);
      if (event.type === 'text' && event.part?.text) {
        response += event.part.text;
      }
    } catch (e) {
      // Skip non-JSON lines
    }
  }

  return response || result || 'No response from agent';
}

/**
 * Cleanup sandbox
 */
export async function cleanupE2BSandbox(cloudflareEnv: Env) {
  if (!sandboxId) return;

  const e2bApiKey = env.E2B_API_KEY || cloudflareEnv.E2B_API_KEY;
  if (!e2bApiKey) return;

  try {
    await fetch(`https://api.e2b.dev/v2/sandboxes/${sandboxId}`, {
      method: 'DELETE',
      headers: {
        'X-API-Key': e2bApiKey,
      },
    });
    console.log('[E2B OpenCode] Sandbox deleted');
  } catch (error) {
    console.error('[E2B OpenCode] Failed to delete sandbox:', error);
  }

  sandboxId = undefined;
}
