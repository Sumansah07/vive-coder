/**
 * Sandbox Orchestrator
 * 
 * Manages on-demand OpenCode agent sandboxes for users.
 * Each user/project gets their own ephemeral sandbox.
 * 
 * Architecture:
 * - User opens project → Create sandbox
 * - User is active → Keep sandbox alive
 * - User is idle → Pause/destroy sandbox
 * - User returns → Restore from snapshot
 */

import { env } from 'node:process';

interface SandboxSession {
  sessionId: string;
  userId: string;
  projectId: string;
  agentUrl: string;
  createdAt: Date;
  lastActivity: Date;
  status: 'creating' | 'active' | 'idle' | 'paused' | 'destroyed';
}

// In-memory session store (use Redis in production)
const activeSessions = new Map<string, SandboxSession>();

/**
 * Create a new sandbox session for a user
 * This spawns an OpenCode agent in Daytona
 */
export async function createSandboxSession(
  userId: string,
  projectId: string,
  cloudflareEnv: Env,
): Promise<SandboxSession> {
  const sessionId = `${userId}-${projectId}-${Date.now()}`;

  // Check if session already exists
  const existing = findActiveSession(userId, projectId);
  if (existing && existing.status === 'active') {
    // Reuse existing session
    existing.lastActivity = new Date();
    return existing;
  }

  const session: SandboxSession = {
    sessionId,
    userId,
    projectId,
    agentUrl: '', // Will be set after creation
    createdAt: new Date(),
    lastActivity: new Date(),
    status: 'creating',
  };

  activeSessions.set(sessionId, session);

  try {
    // Create sandbox via Daytona API
    const agentUrl = await createDaytonaSandbox(sessionId, cloudflareEnv);

    session.agentUrl = agentUrl;
    session.status = 'active';

    return session;
  } catch (error) {
    session.status = 'destroyed';
    throw error;
  }
}

/**
 * Get or create sandbox session
 */
export async function getOrCreateSession(
  userId: string,
  projectId: string,
  cloudflareEnv: Env,
): Promise<SandboxSession> {
  const existing = findActiveSession(userId, projectId);

  if (existing) {
    // Update last activity
    existing.lastActivity = new Date();

    if (existing.status === 'paused') {
      // Resume paused sandbox
      await resumeSandbox(existing.sessionId, cloudflareEnv);
      existing.status = 'active';
    }

    return existing;
  }

  // Create new session
  return createSandboxSession(userId, projectId, cloudflareEnv);
}

/**
 * Create sandbox using Daytona API
 */
async function createDaytonaSandbox(sessionId: string, cloudflareEnv: Env): Promise<string> {
  const daytonaApiKey = env.DAYTONA_API_KEY || cloudflareEnv.DAYTONA_API_KEY;
  const daytonaApiUrl = env.DAYTONA_API_URL || cloudflareEnv.DAYTONA_API_URL || 'https://api.daytona.io';

  if (!daytonaApiKey) {
    throw new Error('DAYTONA_API_KEY is required for sandbox orchestration');
  }

  // Create workspace via Daytona API
  const response = await fetch(`${daytonaApiUrl}/workspaces`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${daytonaApiKey}`,
    },
    body: JSON.stringify({
      name: sessionId,
      image: 'opencode-agent', // Pre-built image with OpenCode
      env: {
        OPENROUTER_API_KEY: env.OPENROUTER_API_KEY || cloudflareEnv.OPENROUTER_API_KEY,
        E2B_API_KEY: env.E2B_API_KEY || cloudflareEnv.E2B_API_KEY,
      },
      ports: [8080], // OpenCode agent port
      autoStart: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create Daytona workspace: ${response.status}`);
  }

  const data = (await response.json()) as { url?: string };

  // Return agent URL (e.g., https://sessionid-8080.daytona.run)
  return data.url || `https://${sessionId}-8080.daytona.run`;
}

/**
 * Resume paused sandbox
 */
async function resumeSandbox(sessionId: string, cloudflareEnv: Env): Promise<void> {
  const daytonaApiKey = env.DAYTONA_API_KEY || cloudflareEnv.DAYTONA_API_KEY;
  const daytonaApiUrl = env.DAYTONA_API_URL || cloudflareEnv.DAYTONA_API_URL || 'https://api.daytona.io';

  await fetch(`${daytonaApiUrl}/workspaces/${sessionId}/start`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${daytonaApiKey}`,
    },
  });
}

/**
 * Pause sandbox (save state, stop container)
 */
export async function pauseSandbox(sessionId: string, cloudflareEnv: Env): Promise<void> {
  const session = activeSessions.get(sessionId);
  if (!session) return;

  const daytonaApiKey = env.DAYTONA_API_KEY || cloudflareEnv.DAYTONA_API_KEY;
  const daytonaApiUrl = env.DAYTONA_API_URL || cloudflareEnv.DAYTONA_API_URL || 'https://api.daytona.io';

  await fetch(`${daytonaApiUrl}/workspaces/${sessionId}/stop`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${daytonaApiKey}`,
    },
  });

  session.status = 'paused';
}

/**
 * Destroy sandbox completely
 */
export async function destroySandbox(sessionId: string, cloudflareEnv: Env): Promise<void> {
  const session = activeSessions.get(sessionId);
  if (!session) return;

  const daytonaApiKey = env.DAYTONA_API_KEY || cloudflareEnv.DAYTONA_API_KEY;
  const daytonaApiUrl = env.DAYTONA_API_URL || cloudflareEnv.DAYTONA_API_URL || 'https://api.daytona.io';

  await fetch(`${daytonaApiUrl}/workspaces/${sessionId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${daytonaApiKey}`,
    },
  });

  activeSessions.delete(sessionId);
}

/**
 * Find active session for user/project
 */
function findActiveSession(userId: string, projectId: string): SandboxSession | undefined {
  for (const session of activeSessions.values()) {
    if (session.userId === userId && session.projectId === projectId && session.status !== 'destroyed') {
      return session;
    }
  }
  return undefined;
}

/**
 * Cleanup idle sessions (run periodically)
 */
export async function cleanupIdleSessions(cloudflareEnv: Env): Promise<void> {
  const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const now = new Date();

  for (const [sessionId, session] of activeSessions.entries()) {
    const idleTime = now.getTime() - session.lastActivity.getTime();

    if (idleTime > IDLE_TIMEOUT && session.status === 'active') {
      console.log(`Pausing idle session: ${sessionId}`);
      await pauseSandbox(sessionId, cloudflareEnv);
    }
  }
}

/**
 * Get all active sessions (for monitoring)
 */
export function getActiveSessions(): SandboxSession[] {
  return Array.from(activeSessions.values());
}
