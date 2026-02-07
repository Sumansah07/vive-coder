// /**
//  * E2B Sandbox Manager
//  * 
//  * Manages sandbox lifecycle:
//  * - Reuses sandboxes per session
//  * - Auto-cleanup after inactivity
//  * - Automatic restart on new messages
//  */

// import { Sandbox } from '@e2b/code-interpreter';

// interface SandboxSession {
//   sandbox: Sandbox;
//   lastActivity: number;
//   sessionId: string;
// }

// class SandboxManager {
//   private sessions: Map<string, SandboxSession> = new Map();
//   private cleanupInterval: NodeJS.Timeout | null = null;
//   private readonly INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

//   constructor() {
//     this.startCleanupTimer();
//   }

//   /**
//    * Get or create sandbox for session
//    */
//   async getOrCreateSandbox(sessionId: string, e2bApiKey: string): Promise<Sandbox> {
//     const existing = this.sessions.get(sessionId);

//     // Reuse existing sandbox if still active
//     if (existing) {
//       console.log('[Sandbox Manager] Reusing sandbox:', existing.sandbox.sandboxId);
//       existing.lastActivity = Date.now();
//       return existing.sandbox;
//     }

//     // Create new sandbox
//     console.log('[Sandbox Manager] Creating new sandbox for session:', sessionId);
//     const sandbox = await Sandbox.create({
//       apiKey: e2bApiKey,
//       metadata: { 
//         purpose: 'bolt-ai-agent',
//         sessionId,
//       },
//     });

//     this.sessions.set(sessionId, {
//       sandbox,
//       lastActivity: Date.now(),
//       sessionId,
//     });

//     console.log('[Sandbox Manager] Sandbox created:', sandbox.sandboxId);
//     return sandbox;
//   }

//   /**
//    * Update activity timestamp
//    */
//   updateActivity(sessionId: string): void {
//     const session = this.sessions.get(sessionId);
//     if (session) {
//       session.lastActivity = Date.now();
//     }
//   }

//   /**
//    * Manually cleanup session
//    */
//   async cleanupSession(sessionId: string): Promise<void> {
//     const session = this.sessions.get(sessionId);
//     if (session) {
//       try {
//         await session.sandbox.kill();
//         console.log('[Sandbox Manager] Cleaned up sandbox:', session.sandbox.sandboxId);
//       } catch (error) {
//         console.error('[Sandbox Manager] Cleanup error:', error);
//       }
//       this.sessions.delete(sessionId);
//     }
//   }

//   /**
//    * Auto-cleanup inactive sandboxes
//    */
//   private startCleanupTimer(): void {
//     this.cleanupInterval = setInterval(async () => {
//       const now = Date.now();
//       const toCleanup: string[] = [];

//       for (const [sessionId, session] of this.sessions.entries()) {
//         if (now - session.lastActivity > this.INACTIVITY_TIMEOUT) {
//           toCleanup.push(sessionId);
//         }
//       }

//       for (const sessionId of toCleanup) {
//         console.log('[Sandbox Manager] Auto-cleanup inactive session:', sessionId);
//         await this.cleanupSession(sessionId);
//       }
//     }, 60 * 1000); // Check every minute
//   }

//   /**
//    * Cleanup all sandboxes (for shutdown)
//    */
//   async cleanupAll(): Promise<void> {
//     if (this.cleanupInterval) {
//       clearInterval(this.cleanupInterval);
//     }

//     for (const sessionId of this.sessions.keys()) {
//       await this.cleanupSession(sessionId);
//     }
//   }
// }

// // Singleton instance
// export const sandboxManager = new SandboxManager();
